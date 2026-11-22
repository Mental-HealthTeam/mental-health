import logging
from abc import abstractmethod, ABC


logger = logging.getLogger(__name__)


class ContactServiceInterface(ABC):
    @abstractmethod
    async def send_contact_message(
        self,
        name: str,
        contact: str,
        message: str,
        user_id: str | None = None,
    ) -> None:
        pass