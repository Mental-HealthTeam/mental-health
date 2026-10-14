from uuid import UUID

from pydantic import BaseModel


class CheckoutRequest(BaseModel):
    booking_id: UUID


class CheckoutResponse(BaseModel):
    session_id: str
    checkout_url: str
