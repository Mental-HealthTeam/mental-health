import logging
import uuid
from abc import ABC, abstractmethod

from fastapi import UploadFile

logger = logging.getLogger(__name__)


class AvatarStorageInterface(ABC):

    @abstractmethod
    async def save_avatar(
            self,
            file: UploadFile,
            user_id: uuid.UUID,
    ) -> str:
        pass

    @abstractmethod
    def delete_avatar_file(
            self,
            avatar_url: str | None,
            user_id: uuid.UUID,
    ) -> None:
        pass