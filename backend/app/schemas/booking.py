from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from database.models.models import (
    BookingStatus,
    PaymentStatus,
    SelectionSource,
)


class BookingCreate(BaseModel):
    client_id: UUID
    psychologist_id: UUID
    selected_time: str
    selection_source: SelectionSource = SelectionSource.MANUAL_FILTER
    ai_session_id: str


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    booking_id: UUID
    client_id: UUID
    psychologist_id: UUID
    selected_time: str
    status: BookingStatus
    payment_status: PaymentStatus
    price: Decimal
    currency: str
    selection_source: SelectionSource
    ai_session_id: str


class BookingUpdate(BaseModel):
    status: BookingStatus | None = None
    payment_status: PaymentStatus | None = None
