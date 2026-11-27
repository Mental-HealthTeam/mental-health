from schemas.auth import ExternalIdentity
from auth.provider_interface import AuthProviderInterface
from database.models.models import AuthProvider


class FakeAuthProvider(AuthProviderInterface):

    def __init__(
        self,
        subject: str = "google-sub-1",
        email: str = "user@example.com",
        name: str | None = "Test User",
        avatar_url: str | None = "https://img.test/avatar.png",
    ):
        self.subject = subject
        self.email = email
        self.name = name
        self.avatar_url = avatar_url
        self.error: Exception | None = None
        self.calls: list[dict] = []


    async def authenticate(self, credentials: dict) -> ExternalIdentity:
        self.calls.append(credentials)
        if self.error is not None:
            raise self.error
        return ExternalIdentity(
                provider=AuthProvider.GOOGLE,
                subject=self.subject,
                email=self.email,
                email_verified=True,
                name=self.name,
                avatar_url=self.avatar_url
            )
