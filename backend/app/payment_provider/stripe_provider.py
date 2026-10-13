import asyncio
import uuid
from collections.abc import Mapping

import stripe
from stripe import StripeError

from payment_provider.payment_interface import (
    PaymentProviderInterface
)
from payment_provider.payment_types import (
    CheckoutParams,
    PaymentEventType,
    PaymentWebhook,
    CheckoutResult,
    RefundRequest,
    RefundResult,
    PayoutRequest,
    PayoutResult,
    WebhookAcknowledgement,
    PaymentProviderName,
    PayoutStatus
)
from exceptions.payments import (
    WebhookVerificationError,
    PaymentProviderError
)


_STRIPE_EVENT_MAP = {
    "checkout.session.completed": PaymentEventType.PAID,
    "checkout.session.async_payment_succeeded": PaymentEventType.PAID,
    "checkout.session.expired": PaymentEventType.EXPIRED,
    "checkout.session.async_payment_failed": PaymentEventType.FAILED,
}


class StripePaymentProvider(PaymentProviderInterface):

    def __init__(
            self,
            api_key: str,
            webhook_secret: str,
            success_url: str,
            cancel_url: str
    ):
        stripe.api_key = api_key
        self.webhook_secret = webhook_secret
        self.success_url = success_url
        self.cancel_url = cancel_url

    @property
    def name(self) -> PaymentProviderName:
        return PaymentProviderName.STRIPE

    async def create_checkout_session(
        self,
        params: CheckoutParams
    ) -> CheckoutResult:
        line_items = [
            {
                "price_data": {
                    "currency": params.currency,
                    "product_data": {"name": str(params.description)},
                    "unit_amount": int(params.amount * 100)
                },
                "quantity": 1
            }
        ]
        metadata = {
            "booking_id": str(params.booking_id)
        }
        checkout_session = await asyncio.to_thread(
            stripe.checkout.Session.create,
            line_items=line_items,
            metadata=metadata,
            mode="payment",
            success_url=self.success_url,
            cancel_url=self.cancel_url,
            client_reference_id=str(params.booking_id)
        )

        return CheckoutResult(
            session_id=checkout_session.id,
            checkout_url=checkout_session.url
        )

    def verify_webhook_event(
        self,
        payload: bytes,
        headers: Mapping[str, str],
    ) -> PaymentWebhook:

        signature = headers.get("stripe-signature")
        if not signature:
            raise WebhookVerificationError()
        try:
            event = stripe.Webhook.construct_event(
                payload,
                signature,
                self.webhook_secret,
            )
        except (ValueError, stripe.SignatureVerificationError) as e:
            raise WebhookVerificationError() from e

        event = event.to_dict()
        event_type = _STRIPE_EVENT_MAP.get(
            event.get("type"),
            PaymentEventType.IGNORED
        )
        ignored = PaymentWebhook(
            event_id=event["id"],
            event_type=PaymentEventType.IGNORED,
            payment_reference=None,
            provider_session_id=None,
            metadata={},
            booking_id=None
        )
        if event_type is PaymentEventType.IGNORED:
            return ignored

        session = event["data"]["object"]
        payment_status = session.get("payment_status")
        if event_type is PaymentEventType.PAID and payment_status != "paid":
            return ignored

        metadata = dict(session.get("metadata") or {})
        client_reference_id = session.get("client_reference_id")
        if client_reference_id is not None:
            try:
                client_reference_id = uuid.UUID(client_reference_id)
            except (ValueError, TypeError):
                client_reference_id = None

        return PaymentWebhook(
            event_id=event.get("id"),
            event_type=event_type,
            payment_reference=session.get("payment_intent"),
            provider_session_id=session.get("id"),
            metadata=metadata,
            booking_id=client_reference_id
        )

    def build_webhook_response(
            self, event: PaymentWebhook
    ) -> WebhookAcknowledgement:
        return WebhookAcknowledgement(
            status_code=200
        )

    async def refund(
            self,
            request: RefundRequest
    ) -> RefundResult:
        refund_params = {"payment_intent": request.payment_reference}
        if request.amount is not None:
            refund_params["amount"] = int(request.amount * 100)
        try:
            refund = await asyncio.to_thread(
                stripe.Refund.create,
                **refund_params
            )
        except StripeError as e:
            raise PaymentProviderError() from e

        return RefundResult(
            refund_id=refund.id
        )

    async def payout(
            self,
            request: PayoutRequest
    ) -> PayoutResult:
        if request.connected_account_id is None:
            raise PaymentProviderError("connected_account_id is required")
        try:
            transfer = await asyncio.to_thread(
                stripe.Transfer.create,
                amount=int(request.amount * 100),
                currency=request.currency,
                destination=request.connected_account_id,
                transfer_group=str(request.booking_id),
                metadata={"booking_id": str(request.booking_id)}
            )
            return PayoutResult(
                payout_reference=transfer.id,
                status=PayoutStatus.PAID
            )
        except StripeError as e:
            raise PaymentProviderError() from e
