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


class Recipient(BaseModel):
    iban: str
    tax_id: str
    account_name: str

    @field_validator("iban")
    @classmethod
    def validate_iban(cls, value: str):
        iban = value.replace(" ", "").upper()

        if len(iban) != 29:
            raise ValueError("IBAN must be 29 characters long")
        if not iban[:2] == "UA":
            raise ValueError("IBAN must start with UA")
        if not (iban[2:].isdigit() and iban[2:].isascii()):
            raise ValueError("IBAN must contain only digits after UA")
        if int("".join(str(int(c, 36)) for c in iban[4:] + iban[:4])) % 97 != 1:
            raise ValueError("IBAN checksum is invalid")
        return iban

    @field_validator("tax_id")
    @classmethod
    def validate_tax_id(cls, value: str):
        if len(value) not in (8, 10):
            raise ValueError("Tax ID must be 8 or 10 digits long")
        if not (value.isascii() and value.isdigit()):
            raise ValueError("Tax ID must contain only digits 0-9")
        return value

    @field_validator("account_name")
    @classmethod
    def validate_account_name(cls, value: str):
        account_name = value.strip()
        if account_name == "":
            raise ValueError("Account name must not be empty")
        if len(account_name) > 255:
            raise ValueError("Account name is too long")
        return account_name


class PayoutRequest(BaseModel):
    reference: str
    amount: Decimal = Field(gt=0)
    currency: str = Field(max_length=3)
    recipient: Recipient
    description: str


class PayoutResult(BaseModel):
    payout_reference: str
    status: PayoutStatus
