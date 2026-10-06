import uuid
from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

from pydantic import BaseModel, ConfigDict, field_validator, model_validator, Field

from database.models.models import SymptomCode

from database.models.models import Gender

from schemas.psychologist import MockSlot


class MatchingInfo(BaseModel):
    session_id: str
    symptom_codes: list[SymptomCode] = Field(min_length=1)
    language: list[str]
    preferred_gender: Gender | None = None
    min_price_per_hour: int | None = Field(ge=0, default=None)
    max_price_per_hour: int | None = Field(ge=0, default=None)
    min_experience_years: int | None = Field(ge=0, default=None)
    max_experience_years: int | None = Field(ge=0, default=None)
    min_range_suitable_time: datetime | None = None
    max_range_suitable_time: datetime | None = None

    @field_validator(
        "min_range_suitable_time",
        "max_range_suitable_time"
    )
    @classmethod
    def default_to_kyiv(cls, value: datetime | None):
        if value is not None and value.tzinfo is None:
            return value.replace(tzinfo=ZoneInfo("Europe/Kyiv"))
        return value

    @model_validator(mode="after")
    def validate_min_max(self):
        if self.min_price_per_hour is not None and self.max_price_per_hour is not None:
            if self.min_price_per_hour > self.max_price_per_hour:
                self.min_price_per_hour, self.max_price_per_hour = (
                    self.max_price_per_hour,
                    self.min_price_per_hour
                )
        if self.min_experience_years is not None and self.max_experience_years is not None:
            if self.min_experience_years > self.max_experience_years:
                self.min_experience_years, self.max_experience_years = (
                    self.max_experience_years,
                    self.min_experience_years
                )
        if self.min_range_suitable_time is not None and self.max_range_suitable_time is not None:
            if self.min_range_suitable_time > self.max_range_suitable_time:
                self.min_range_suitable_time, self.max_range_suitable_time = (
                    self.max_range_suitable_time,
                    self.min_range_suitable_time
                )
        return self


class MatchingSearchRequest(BaseModel):
    matching_info: MatchingInfo | None = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "matching_info": {
                    "session_id": "test-session-001",
                    "symptom_codes": ["anxiety", "burnout"],
                    "language": ["uk"],
                    "preferred_gender": None,
                    "min_price_per_hour": None,
                    "max_price_per_hour": 2000,
                    "min_experience_years": None,
                    "max_experience_years": None,
                    "min_range_suitable_time": None,
                    "max_range_suitable_time": None,
                }
            }
        }
    )


class PsychologistMatchResult(BaseModel):
    psychologist_id: uuid.UUID
    full_name: str
    title: str
    avatar_url: str | None
    price_per_hour: Decimal
    languages: list[str]
    mock_slots: list[MockSlot]
    matched_symptom_codes: list[SymptomCode]

    model_config = {"from_attributes": True}


class MatchingSearchResponse(BaseModel):
    result: list[PsychologistMatchResult]
