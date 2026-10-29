import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator, Field

from database.models.models import (
    BookingStatus,
    PaymentStatus,
    SelectionSource,
)


class BookingCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    psychologist_id: UUID
    selected_time: datetime.datetime
    ai_session_id: str | None = Field(max_length=50, default=None)

    @field_validator("selected_time")
    @classmethod
    def validate_selected_time(cls, value: datetime.datetime):
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Selected time must include a timezone.")
        return value


class DisputeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    note: str = Field(min_length=1, max_length=500)


class ResolveDisputeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    new_status: BookingStatus

    @field_validator("new_status")
    @classmethod
    def validate_new_status(cls, value: BookingStatus):
        if value not in (BookingStatus.COMPLETED, BookingStatus.CANCELLED):
            raise ValueError("A dispute can only be resolved as completed or cancelled.")
        return value


class BookingPsychologist(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    psychologist_id: UUID
    full_name: str = Field(validation_alias="display_full_name")
    title: str = Field(validation_alias="display_title")
    avatar_url: str | None


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    booking_id: UUID = Field(validation_alias="id")
    psychologist: BookingPsychologist
    selected_time: datetime.datetime
    status: BookingStatus
    payment_status: PaymentStatus
    price: Decimal
    currency: str
    selection_source: SelectionSource
    ai_session_id: str | None
    hold_expires_at: datetime.datetime | None
    meet_link: str | None = None


class BookingListResponse(BaseModel):
    items: list[BookingResponse]
    total: int
    limit: int
    offset: int


class BookingCancelRequest(BaseModel):
    confirm_no_refund: bool = False
