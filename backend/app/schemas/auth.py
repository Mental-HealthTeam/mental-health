import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from database.models.models import AuthProvider, UserRole


class ExternalIdentity(BaseModel):
    model_config = ConfigDict(frozen=True)

    provider: AuthProvider
    subject: str
    email: EmailStr
    email_verified: bool
    name: str | None = None
    avatar_url: str | None = None


class GoogleLoginRequest(BaseModel):
    credential: str = Field(min_length=1)


class UserPublic(BaseModel):
    id: uuid.UUID
    email: EmailStr
    name: str | None = None
    avatar_url: str | None = None
    role: UserRole

    model_config = ConfigDict(from_attributes=True)


class ClientInfo(BaseModel):
    user_agent: str | None = None
    ip: str | None = Field(max_length=45, default=None)

    @field_validator("user_agent")
    @classmethod
    def truncate_user_agent(cls, value: str | None):
        return value[:255] if value else None


class SessionCreateData(ClientInfo):
    user_id: uuid.UUID
    family_id: uuid.UUID | None = None


class SessionRotateData(ClientInfo):
    refresh_token: str


class RevokeSessionSchema(BaseModel):
    refresh_token: str


class RevokeAllSchema(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
