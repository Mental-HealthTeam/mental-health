import uuid
from decimal import Decimal

from pydantic import BaseModel

from database.models.models import SymptomCode

from database.models.models import Gender


class MatchingInfo(BaseModel):
    session_id: str
    symptom_codes: list[SymptomCode]
    language: list[str]
    preferred_gender: Gender | None = None
    min_price_per_hour: int | None = None
    max_price_per_hour: int | None = None
    min_experience_years: int | None = None
    max_experience_years: int | None = None


class MatchingSearchRequest(BaseModel):
    matching_info: MatchingInfo | None = None


class PsychologistMatchResult(BaseModel):
    psychologist_id: uuid.UUID
    full_name: str
    title: str
    avatar_url: str | None
    price_per_hour: Decimal
    languages: list[str]
    mock_slots: list[str]
    matched_symptom_codes: list[SymptomCode]

    model_config = {"from_attributes": True}


class MatchingSearchResponse(BaseModel):
    result: list[PsychologistMatchResult]
