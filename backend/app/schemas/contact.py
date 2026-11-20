import re
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ContactRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    contact: str = Field(min_length=3, max_length=254)
    message: str = Field(min_length=1, max_length=5000)
    user_id: UUID | None = None

    @field_validator("contact")
    @classmethod
    def validate_contact(cls, value: str):
        value = value.strip()
        telegram_re = re.compile(r"^@?[A-Za-z0-9_]{5,32}$")
        email_re = re.compile(
            r"^(?!\.)(?!.*\.\.)[A-Za-z0-9.]{6,30}@(gmail|googlemail)\.com$"
        )
        if not (
            telegram_re.fullmatch(value)
            or email_re.fullmatch(value)
        ):
            raise ValueError("Enter a valid Gmail or Telegram address.")
        return value.removeprefix("@")

    @field_validator("name", "contact")
    @classmethod
    def reject_newlines(cls, value: str) -> str:
        if "\n" in value or "\r" in value:
            raise ValueError("Newlines are not allowed.")
        value = value.strip()
        if not value:
            raise ValueError("Field must not be empty.")
        return value

    @field_validator("message")
    @classmethod
    def strip_and_validate_message(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Field must not be empty.")
        return value
