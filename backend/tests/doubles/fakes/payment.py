from collections.abc import Mapping

from payment_provider.payment_types import (
    CheckoutParams,
    CheckoutResult,
    PaymentWebhook,
    WebhookAcknowledgement,
    RefundRequest,
    RefundResult,
    PayoutRequest,
    PayoutResult
)
from payment_provider.payment_interface import PaymentProviderInterface
from payment_provider.payment_types import PaymentProviderName, PayoutStatus
from exceptions.payments import WebhookVerificationError


class FakePaymentProvider(PaymentProviderInterface):
    def __init__(
            self
    ):
        self.checkout_calls: list[CheckoutParams] = []
        self.refund_calls: list[RefundRequest] = []
        self.payout_calls: list[PayoutRequest] = []
        self.next_webhook: PaymentWebhook | None = None
        self.checkout_error: Exception | None = None
        self.refund_error: Exception | None = None
        self.payout_error: Exception | None = None
        self.payout_status = PayoutStatus.PAID


    @property
    def name(self):
        return PaymentProviderName.WAYFORPAY

    async def create_checkout_session(
        self,
        params: CheckoutParams,
    ) -> CheckoutResult:
        self.checkout_calls.append(params)
        if self.checkout_error is not None:
            raise self.checkout_error
        session_id = f"{params.booking_id}_1"
        return CheckoutResult(
            session_id=session_id,
            checkout_url=f"https://pay.test/checkout/{session_id}"
        )

    def verify_webhook_event(
        self,
        payload: bytes,
        headers: Mapping[str, str]
    ) -> PaymentWebhook:
        if self.next_webhook is None:
            raise WebhookVerificationError()
        return self.next_webhook

    def build_webhook_response(
            self,
            event: PaymentWebhook
    ) -> WebhookAcknowledgement:
        return WebhookAcknowledgement(
            status_code=200,
            body={"orderReference": event.provider_session_id or "", "status": "accept"},
        )

    async def refund(
            self,
            request: RefundRequest
    ) -> RefundResult:
        self.refund_calls.append(request)
        if self.refund_error is not None:
            raise self.refund_error
        order_reference = request.payment_reference
        return RefundResult(refund_id=order_reference)

    async def payout(
            self,
            request: PayoutRequest
    ) -> PayoutResult:
        self.payout_calls.append(request)
        if self.payout_error is not None:
            raise self.payout_error

        return PayoutResult(
            payout_reference=request.reference,
            status=self.payout_status
        )