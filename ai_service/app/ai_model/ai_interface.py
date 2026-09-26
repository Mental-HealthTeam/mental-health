from abc import ABC, abstractmethod


class AIClientInterface(ABC):

    @abstractmethod
    async def generate_reply(self, messages: list[dict], model: str = ...):
        pass

    @abstractmethod
    async def stream_reply(self, messages: list[dict], model: str = ...) -> str:
        pass
