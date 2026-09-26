from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    email: str
    role: str


class UserUpdate(BaseModel):
    email: str | None = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    email: str
    role: str
    created_at: datetime


class PsychologistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    psychologist_id: UUID
    full_name: str
    bio: str
    price_per_hour: float
    profile_status: str

class PsychologistUpdate(BaseModel):

    full_name: str | None = None
    bio: str | None = None
    price_per_hour: float| None = None

class SlotCreate(BaseModel):

    start_time: datetime
    end_time: datetime

class SlotUpdate(BaseModel):

    start_time: datetime | None = None
    end_time: datetime | None = None

class SlotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slot_id: UUID
    psychologist_id: UUID
    start_time: datetime
    end_time: datetime
    is_booked: bool

class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    booking_id: UUID
    client_id: UUID
    psychologist_id: UUID
    slot_id: UUID
    status: str
    payment_status: str
    price: float
    currency: str
    ai_session_id: str

class BookingCreate(BaseModel):
    pass

class BookingUpdate(BaseModel):
    pass

class AI_SessionResponse(BaseModel):
    pass

