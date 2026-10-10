from enum import Enum
from decimal import Decimal
from pydantic import BaseModel, ConfigDict


class PaymentEventType(str, Enum):
    PAID = "paid"
    EXPIRED = "expired"
    REFUNDED = "refunded"
    FAILED = "failed"
    IGNORED = "ignored"


class PaymentProviderName(str, Enum):
    STRIPE = "stripe"
    MONOBANK = "monobank"


class PaymentKind(str, Enum):
    ONE_TIME = "one_time"
    SUBSCRIPTION = "subscription"


class CheckoutParams(BaseModel):
    line_items: list[dict]
    metadata: dict[str, str]
    payment_kind: PaymentKind
    client_reference_id: str
    success_url: str
    cancel_url: str


class CheckoutResponse(BaseModel):
    session_id: str
    checkout_url: str


class PaymentWebhook(BaseModel):
    model_config = ConfigDict(frozen=True)

    event_type: str
    payment_status: str | None
    provider_session_id: str
    metadata: dict[str, str]


class Refund(BaseModel):
    payment_intent_id: str
    amount: Decimal | None = None
