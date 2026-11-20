import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

from database.models.models import SymptomCode
from schemas.auth import UserPublic


class UserProfileResponse(UserPublic):
    meet_link: str | None = None
    telegram: str | None = Field(default=None, max_length=255)
    topics: list[SymptomCode] | None = None


class UserProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, max_length=255)
    telegram: str | None = Field(default=None, max_length=255)
    topics: list[SymptomCode] | None = None

    @field_validator("telegram")
    @classmethod
    def validate_telegram(cls, value: str | None):
        if not value or value.strip() == "":
            return None
        telegram_re = re.compile(r"^@?[A-Za-z0-9_]{5,32}$")
        value = value.strip()
        if not telegram_re.fullmatch(value):
            raise ValueError(
                "Telegram username must be 5-32 characters: "
                "Latin letters, digits and underscore."
            )
        return value.removeprefix("@")
