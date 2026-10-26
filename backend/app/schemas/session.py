import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from database.models.models import BookingStatus, PaymentStatus


class SessionPsychologist(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    psychologist_id: UUID
    full_name: str = Field(validation_alias="display_full_name")
    title: str = Field(validation_alias="display_title")
    avatar_url: str | None = None


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
    client: SessionClient | None = None


class SessionListResponse(BaseModel):
    items: list[SessionResponse]
    total: int
