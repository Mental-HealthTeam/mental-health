from datetime import datetime, timezone

from fastapi import status

from redis_storage.redis_interface import SessionStorageInterface
from exceptions.base import AppError


class FakeSessionStorage(SessionStorageInterface):

    def __init__(self):
        self.calls: dict[str, int] = {}
        self.error: Exception | None = None
        self.storage: dict[str, dict[str, str]] = {}


    def add_session(
            self,
            session_id: str,
            message_count: int = 4,
            created_at: int | None = None,
    ):
        self.storage[session_id] = {
            "created_at": str(
                created_at if created_at is not None
                else int(datetime.now(timezone.utc).timestamp() - 60)
            ),
            "message_count": str(message_count)
        }

    async def get_recording_info(self, session_id: str) -> dict:
        response = {}
        self.calls[session_id] = self.calls.get(session_id, 0) + 1
        if self.error is not None:
            raise self.error
        meta_info = self.storage.get(session_id, None)
        if not meta_info:
            raise AppError(
                status.HTTP_404_NOT_FOUND,
                "RECORDING_SESSION_NOT_FOUND",
                f"Session {session_id!r} not found!",
            )
        response["created_at"] = meta_info["created_at"]
        response["message_count"] = meta_info["message_count"]

        return response
