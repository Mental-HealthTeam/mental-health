from abc import ABC, abstractmethod
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


class PaymentProviderInterface(ABC):

    @property
    @abstractmethod
    def name(self):
        pass

    @abstractmethod
    async def create_checkout_session(
        self,
        params: CheckoutParams,
    ) -> CheckoutResult:
        pass

    @abstractmethod
    def verify_webhook_event(
        self,
        payload: bytes,
        headers: Mapping[str, str]
    ) -> PaymentWebhook:
        pass

    @abstractmethod
    def build_webhook_response(
            self,
            event: PaymentWebhook
    ) -> WebhookAcknowledgement:
        pass

    @abstractmethod
    async def refund(
            self,
            request: RefundRequest
    ) -> RefundResult:
        pass

    @abstractmethod
    async def payout(
            self,
            request: PayoutRequest
    ) -> PayoutResult:
        pass
