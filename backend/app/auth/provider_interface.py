from abc import ABC, abstractmethod

from schemas.auth import ExternalIdentity


class AuthProviderInterface(ABC):
    @abstractmethod
    async def authenticate(self, credentials: dict) -> ExternalIdentity:
        pass
