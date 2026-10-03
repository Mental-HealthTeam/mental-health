from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from database import get_db
from services.payment_service import create_checkout_session


router = APIRouter()


class CheckoutRequest(BaseModel):
    psychologist_id: UUID
    selected_time: str


class CheckoutResponse(BaseModel):
    checkout_url: str


@router.post(
    "/checkout",
    response_model=CheckoutResponse,
)
async def create_checkout(
    body: CheckoutRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        checkout_url = await create_checkout_session(
            db=db,
            psychologist_id=body.psychologist_id,
            selected_time=body.selected_time,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )

    return CheckoutResponse(
        checkout_url=checkout_url,
    )
