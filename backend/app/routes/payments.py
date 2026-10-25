import logging
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Request,
    Response
)
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db

from config.dependencies import get_payment_provider
from database.models.models import User
from payment_provider.payment_interface import PaymentProviderInterface
from payment_provider.payment_types import PaymentProviderName
from schemas.payments import CheckoutRequest, CheckoutResponse
from auth.dependencies import get_current_user
from services.payment_service import (
    create_checkout_service,
    handle_webhook
)
from starlette.responses import JSONResponse

router = APIRouter()

logger = logging.getLogger(__name__)


@router.post(
    "/checkout",
    response_model=CheckoutResponse,
    status_code=status.HTTP_200_OK
)
async def create_checkout(
        db: Annotated[AsyncSession, Depends(get_db)],
        client: Annotated[User, Depends(get_current_user)],
        payment_provider: Annotated[PaymentProviderInterface, Depends(get_payment_provider)],
        data: CheckoutRequest
) -> CheckoutResponse:
    return await create_checkout_service(
        db=db,
        client=client,
        payment_provider=payment_provider,
        data=data
    )


@router.post(
    "/webhook/{provider}",
    status_code=status.HTTP_200_OK
)
async def webhook(
        db: Annotated[AsyncSession, Depends(get_db)],
        payment_provider: Annotated[PaymentProviderInterface, Depends(get_payment_provider)],
        provider: PaymentProviderName,
        request: Request,
):
    if provider != payment_provider.name:
        logger.warning(
            "Rejected %s webhook: the active provider is %s",
            provider.value, payment_provider.name.value
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook provider is not active."
        )
    payload = await request.body()
    headers = request.headers

    response = await handle_webhook(
        db=db,
        payment_provider=payment_provider,
        provider=provider,
        payload=payload,
        headers=headers
    )
    if not response.body:
        return Response(status_code=response.status_code)
    return JSONResponse(
        status_code=response.status_code,
        content=response.body
    )
