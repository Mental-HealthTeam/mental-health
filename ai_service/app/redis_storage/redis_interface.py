from abc import ABC, abstractmethod


class SessionStorageInterface(ABC):
    @abstractmethod
    async def append_message(self, session_id: str, role: str, content: str):
        pass

    @abstractmethod
    async def get_history(self, session_id: str) -> list[dict]:
        pass
