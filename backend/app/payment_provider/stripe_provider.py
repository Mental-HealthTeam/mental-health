import asyncio
from typing import Any
import stripe

from payment_provider.payment_interface import (
    PaymentProviderInterface
)
from payment_provider.payment_types import (
    CheckoutParams,
    PaymentEventType,
    PaymentWebhook,
    Refund,
)
from exceptions.payments import WebhookVerificationError


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
            webhook_secret: str
    ):
        stripe.api_key = api_key
        self.webhook_secret = webhook_secret

    async def create_checkout_session(
        self,
        params: CheckoutParams
    ) -> stripe.checkout.Session:
        checkout_session = await asyncio.to_thread(
            stripe.checkout.Session.create,
            metadata=params.metadata,
            mode=params.payment_kind,
            line_items=params.line_items,
            success_url=params.success_url,
            cancel_url=params.cancel_url,
            client_reference_id=params.client_reference_id
        )

        return checkout_session

    async def verify_webhook_event(
        self,
        payload: bytes,
        signature: str,
    ) -> PaymentWebhook:
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
            event_type=PaymentEventType.IGNORED.value,
            payment_status=None,
            provider_session_id="",
            metadata={},
        )
        if event_type is PaymentEventType.IGNORED:
            return ignored

        session = event["data"]["object"]
        payment_status = session.get("payment_status")
        if event_type is PaymentEventType.PAID and payment_status != "paid":
            return ignored

        metadata = dict(session.get("metadata") or {})
        client_reference_id = session.get("client_reference_id")
        if client_reference_id:
            metadata.setdefault("client_reference_id", client_reference_id)

        return PaymentWebhook(
            event_type=event_type.value,
            payment_status=payment_status,
            provider_session_id=session["id"],
            metadata=metadata,
        )

    async def refund(
            self,
            payload: Refund
    ) -> Any:
        refund_params = {"payment_intent": payload.payment_intent_id}
        if payload.amount is not None:
            refund_params["amount"] = payload.amount

        return await asyncio.to_thread(
            stripe.Refund.create,
            **refund_params
        )
