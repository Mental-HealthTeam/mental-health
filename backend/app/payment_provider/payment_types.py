from enum import Enum
from decimal import Decimal
from uuid import UUID
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator
)


class PaymentEventType(str, Enum):
    PAID = "paid"
    EXPIRED = "expired"
    REFUNDED = "refunded"
    FAILED = "failed"
    IGNORED = "ignored"


class PaymentProviderName(str, Enum):
    STRIPE = "stripe"
    WAYFORPAY = "wayforpay"


class PayoutStatus(str, Enum):
    SIMULATED = "simulated"
    PENDING = "pending"
    PAID = "paid"


class CheckoutParams(BaseModel):
    booking_id: UUID
    amount: Decimal
    currency: str = Field(max_length=3)
    description: str

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value: Decimal):
        if value <= Decimal(0):
            raise ValueError("Amount can not be less than 0")
        return value


class CheckoutResult(BaseModel):
    session_id: str
    checkout_url: str


class PaymentWebhook(BaseModel):
    model_config = ConfigDict(frozen=True)

    event_id: str
    event_type: PaymentEventType
    payment_reference: str | None = None
    provider_session_id: str | None = None
    metadata: dict[str, str]
    booking_id: UUID | None = None


class RefundRequest(BaseModel):
    payment_reference: str
    amount: Decimal | None = None


class RefundResult(BaseModel):
    refund_id: str


class WebhookAcknowledgement(BaseModel):
    status_code: int = 200
    body: dict[str , str | int] | None = None


class PayoutRequest(BaseModel):
    booking_id: UUID
    amount: Decimal
    currency: str = Field(max_length=3)
    recipient_token: str | None = None
    # TODO: stripe_account_id should be added
    connected_account_id: str | None = None


class PayoutResult(BaseModel):
    payout_reference: str
    status: PayoutStatus
