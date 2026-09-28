from abc import ABC, abstractmethod


class SessionStorageInterface(ABC):

    @abstractmethod
    async def get_recording_info(self, session_id: str) -> dict:
        pass
