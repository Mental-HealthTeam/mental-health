from abc import ABC, abstractmethod
from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class PaymentWebhook:
    event_type: str
    payment_status: str | None
    provider_session_id: str
    metadata: dict[str, str]


class PaymentProviderInterface(ABC):

    @abstractmethod
    async def create_checkout(
        self,
        psychologist_id: UUID,
        selected_time: str,
        amount: int,
        psychologist_name: str,
    ) -> str:
        pass

    @abstractmethod
    def parse_webhook(
        self,
        payload: bytes,
        signature: str,
    ) -> PaymentWebhook:
        pass
