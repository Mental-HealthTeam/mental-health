from typing import Any
from abc import ABC, abstractmethod

from payment_provider.payment_types import (
    CheckoutParams,
    CheckoutResponse,
    PaymentWebhook
)


class PaymentProviderInterface(ABC):

    @abstractmethod
    async def create_checkout_session(
        self,
        params: CheckoutParams,
    ) -> CheckoutResponse:
        pass

    @abstractmethod
    async def verify_webhook_event(
        self,
        payload: bytes,
        signature: str,
    ) -> PaymentWebhook:
        pass

    @abstractmethod
    async def refund(self, payload: dict) -> Any:
        pass
