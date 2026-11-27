from datetime import datetime
from typing import Self
from uuid import UUID

from pydantic import BaseModel, field_validator, model_validator, Field

from services.psychologist_service import _contains_cyrillic, _contains_latin


class ReviewCreate(BaseModel):
    booking_id: UUID
    client_id: UUID
    psychologist_id: UUID
    rating: int = Field(ge=1, le=5)
    review_text: str | None = None
    review_text_eng: str | None = None

    @field_validator("review_text", "review_text_eng")
    @classmethod
    def validate_review_text_length(cls, value: str | None):
        if value == "":
            return None
        if value:
            value = value.strip()
            if not 10 <= len(value) <= 1000:
                raise ValueError(
                    "Review text must be between 10 and 1000 characters."
                )
        return value

    @field_validator("review_text")
    @classmethod
    def validate_review_text(cls, value: str | None) -> str | None:
        if value:
            if not _contains_cyrillic(value):
                raise ValueError("Review text must contain Cyrillic letters.")
        return value

    @field_validator("review_text_eng")
    @classmethod
    def validate_review_text_eng(cls, value: str | None) -> str | None:
        if value:
            if not _contains_latin(value):
                raise ValueError("English review text must contain Latin letters.")
        return value

    @model_validator(mode="after")
    def validate_not_empty_review(self) -> Self:
        if not (self.review_text or self.review_text_eng):
            raise ValueError(
                "At least one of review_text or review_text_eng is required."
            )
        return self


class UserReview(BaseModel):
    name: str | None
    avatar_url: str | None


class ReviewResponse(BaseModel):
    client: UserReview
    booking_id: UUID
    psychologist_id: UUID
    review_text: str | None
    review_text_eng: str | None
    rating: int
    created_at: datetime


class ReviewViewResponse(BaseModel):
    client: UserReview
    psychologist_id: UUID
    review_text: str
    rating: int
    created_at: datetime


class ReviewListResponse(BaseModel):
    items: list[ReviewViewResponse]
    total: int
