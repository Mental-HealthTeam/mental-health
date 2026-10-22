from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ContactRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    contact: str = Field(min_length=3, max_length=254)
    message: str = Field(min_length=1, max_length=5000)
    user_id: UUID | None = None

    @field_validator("name", "contact", "message")
    @classmethod
    def strip_and_validate(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Field must not be empty.")
        return value
