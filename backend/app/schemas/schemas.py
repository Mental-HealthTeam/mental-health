from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

from database.models.models import (
    Gender,
    SymptomCode,
    UserRole,
)


class UserCreate(BaseModel):
    email: EmailStr
    role: UserRole


class UserUpdate(BaseModel):
    email: EmailStr | None = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    email: EmailStr
    role: UserRole
    created_at: datetime


class PsychologistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    psychologist_id: UUID
    full_name: str
    bio: str
    price_per_hour: Decimal
    profile_status: str
    gender: Gender
    languages: list[str]


class PsychologistUpdate(BaseModel):
    full_name: str | None = None
    bio: str | None = None
    price_per_hour: Decimal | None = None
    gender: Gender | None = None
    languages: list[str] | None = None


class PsychologistSpecializationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    psychologist_id: UUID
    symptom_code: SymptomCode


class AI_SessionResponse(BaseModel):  # noqa: N801
    model_config = ConfigDict(from_attributes=True)

    log_id: UUID
    ai_session_id: str
    user_id: UUID | None
    messages_count: int
    duration_sec: int
    recommendations_count: int


class AISessionSymptomCodeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    log_id: UUID
    symptom_code: SymptomCode
