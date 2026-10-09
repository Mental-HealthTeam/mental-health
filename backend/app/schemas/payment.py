from uuid import UUID

from pydantic import BaseModel


class CheckoutRequest(BaseModel):
    psychologist_id: UUID
    selected_time: str


class CheckoutResponse(BaseModel):
    checkout_url: str
