
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class CheckoutParams:
    booking_id: str
    amount: int
    currency: str
    psychologist_name: str
    success_url: str
    cancel_url: str


@dataclass(frozen=True)
class CheckoutResponse:
    session_id: str
    checkout_url: str


@dataclass(frozen=True)
class PaymentWebhook:
    event_type: str
    payment_status: str | None
    provider_session_id: str
    metadata: dict[str, str]


class PaymentProviderInterface(ABC):

    @abstractmethod
    async def create_checkout_session(
        self,
        params: CheckoutParams,
    ) -> CheckoutResponse:
        pass

    @abstractmethod
    def parse_webhook(
        self,
        payload: bytes,
        signature: str,
    ) -> PaymentWebhook:
        pass
