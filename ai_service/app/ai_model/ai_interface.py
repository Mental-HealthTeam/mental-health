from abc import ABC, abstractmethod


class AIClientInterface(ABC):

    @abstractmethod
    def generate_reply(self, message: str):
        pass