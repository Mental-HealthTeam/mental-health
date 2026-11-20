from uuid import UUID

from pydantic import BaseModel, Field

from database.models.models import Language


class CheckoutRequest(BaseModel):
    booking_id: UUID
    language: Language = Field(default=Language.UKRAINIAN)


class CheckoutResponse(BaseModel):
    session_id: str
    checkout_url: str
