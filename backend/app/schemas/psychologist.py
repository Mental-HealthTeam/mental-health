from datetime import datetime, date
from decimal import Decimal
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    model_validator,
    field_validator,
    Field,
)

from database.models.models import SymptomCode, Language


class MockSlot(BaseModel):
    time: datetime


class Review(BaseModel):
    id: UUID
    author: str
    avatar_url: str | None = None
    topic_id: str
    age: int | None = None
    rating: int
    verified: bool
    text: str
    created_at: date


class Certificate(BaseModel):
    title: str


class PsychologistListItem(BaseModel):
    psychologist_id: UUID
    full_name: str
    avatar_url: str | None
    experience_years: int
    price_per_hour: Decimal
    methods: list[str]
    topics: list[str]
    mock_slots: list[MockSlot]


class PsychologistDetailResponse(BaseModel):
    psychologist_id: UUID
    full_name: str
    title: str
    avatar_url: str | None
    price_per_hour: Decimal
    languages: list[str]
    is_verified: bool
    session_minutes: int
    topics: list[str]
    experience_years: int
    methods: list[str]
    bio: dict[str, str]
    certificates: list[Certificate]
    reviews: list[Review]
    mock_slots: list[MockSlot]


class PsychologistBioFields(BaseModel):
    about: str | None = None
    approach: str | None = None
    scope: str | None = None

    @model_validator(mode="after")
    def validate_not_empty(self):
        if not self.model_fields_set:
            raise ValueError("At least one bio field must be provided")

        if any(
            value is not None and not value.strip()
            for value in self.model_dump().values()
        ):
            raise ValueError("Bio fields must not be empty")

        return self


class PsychologistProfileUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    bio: PsychologistBioFields | None = None
    topics: list[SymptomCode] | None = None
    methods: list[str] | None = None
    certificates: list[str] | None = None
    languages: list[str] | None = None
    experience_years: int | None = Field(default=None, ge=0)
    price_per_hour: Decimal | None = Field(default=None, gt=0)

    @field_validator("title")
    @classmethod
    def validate_title_not_blank(cls, value):
        if value is not None and not value.strip():
            raise ValueError("Title cannot be blank")
        return value

    @field_validator("methods", "certificates")
    @classmethod
    def validate_list_items_not_blank(cls, values):
        if values is not None and any(
            not value.strip() for value in values
        ):
            raise ValueError("List items cannot be blank")
        return values

    @field_validator("languages")
    @classmethod
    def validate_languages(cls, values):
        if values is not None:
            allowed_languages = {language.value for language in Language}

            if not values:
                raise ValueError("At least one language is required")

            if any(language not in allowed_languages for language in values):
                raise ValueError("Unsupported language code")

        return values

    @model_validator(mode="after")
    def validate_not_empty(self):
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        return self


class PsychologistProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    psychologist_id: UUID
    title: str
    title_eng: str
    bio: dict[str, str]
    bio_eng: dict[str, str]
    topics: list[SymptomCode]
    methods: list[str]
    methods_eng: list[str]
    certificates: list[str]
    languages: list[str]
    experience_years: int
    price_per_hour: Decimal
    mock_slots: list[MockSlot]
