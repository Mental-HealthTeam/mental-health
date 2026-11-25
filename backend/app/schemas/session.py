import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from database.models.models import BookingStatus, PaymentStatus, SymptomCode
from schemas.psychologist import MockSlot


class SessionPsychologist(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    psychologist_id: UUID
    full_name: str
    title: str | None = None
    avatar_url: str | None = None
    specializations: list[str] = Field(default_factory=list)


class SessionClient(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str | None = None
    avatar_url: str | None = None


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    booking_id: UUID = Field(validation_alias="id")
    selected_time: datetime.datetime
    status: BookingStatus
    payment_status: PaymentStatus
    price: Decimal
    currency: str
    meet_link: str | None = None
    psychologist: SessionPsychologist
    saved: bool = False
    client: SessionClient | None = None


class SessionListResponse(BaseModel):
    items: list[SessionResponse]
    total: int


class SessionPsychologistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    booking_id: UUID = Field(validation_alias="id")
    selected_time: datetime.datetime
    status: BookingStatus
    payment_status: PaymentStatus
    price: Decimal
    currency: str
    meet_link: str | None = None
    psychologist: SessionPsychologist
    request: list[SymptomCode]
    client: SessionClient | None = None


class SessionPsychologistListResponse(BaseModel):
    items: list[SessionPsychologistResponse]
    total: int


class AllSessionPsychologist(BaseModel):
    booked_items: list[SessionPsychologistResponse]
    free_slots: list[MockSlot]
    total: int


class SessionSavedResponse(BaseModel):
    booking_id: UUID
    saved: bool


class FreeSlotListResponse(BaseModel):
    items: list[MockSlot]
    total: int
