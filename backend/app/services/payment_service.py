from collections.abc import Mapping
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.models import User
from config.settings import BaseAppSettings
from schemas.payments import CheckoutRequest, CheckoutResponse
from payment_provider.payment_interface import PaymentProviderInterface
from payment_provider.payment_types import (
    PaymentProviderName,
    WebhookAcknowledgement
)


async def create_checkout(
        db: AsyncSession,
        settings: BaseAppSettings,
        client: User,
        payment_provider: PaymentProviderInterface,
        data: CheckoutRequest
) -> CheckoutResponse:
    raise NotImplementedError


async def handle_webhook(
        db: AsyncSession,
        payment_provider: PaymentProviderInterface,
        provider: PaymentProviderName,
        payload: bytes,
        headers: Mapping[str, str]
) -> WebhookAcknowledgement:
    raise NotImplementedError
