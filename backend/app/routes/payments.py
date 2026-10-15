from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Request
)
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db

from config.dependencies import get_settings
from database.models.models import User
# from payment_provider.payment_interface import PaymentProviderInterface
from payment_provider.payment_types import PaymentProviderName
from schemas.payments import CheckoutRequest, CheckoutResponse
from auth.dependencies import get_current_user
from config.settings import BaseAppSettings

router = APIRouter()


def not_implemented() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Not implemented."
    )


@router.post(
    "/checkout",
    response_model=CheckoutResponse,
    status_code=status.HTTP_200_OK
)
async def create_checkout(
        db: Annotated[AsyncSession, Depends(get_db)],
        settings: Annotated[BaseAppSettings, Depends(get_settings)],
        client: Annotated[User, Depends(get_current_user)],
        # payment_provider: Annotated[PaymentProviderInterface, Depends(get_payment_provider)],
        data: CheckoutRequest
) -> CheckoutResponse:
    raise not_implemented()


@router.post(
    "/webhook/{provider}",
    status_code=status.HTTP_200_OK
)
async def webhook(
        db: Annotated[AsyncSession, Depends(get_db)],
        # payment_provider: Annotated[PaymentProviderInterface, Depends(get_payment_provider)],
        provider: PaymentProviderName,
        request: Request,
):
    raise not_implemented()
