from pydantic import BaseModel, ConfigDict, EmailStr

from database.models.models import AuthProvider


class ExternalIdentity(BaseModel):
    model_config = ConfigDict(frozen=True)

    provider: AuthProvider
    subject: str
    email: EmailStr
    email_verified: bool
    name: str | None = None
    avatar_url: str | None = None
