from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import require_roles
from database import get_db
from database.models.models import Language, User, UserRole
from schemas.session import SessionListResponse, SessionResponse
from services.booking_localization import build_booking_psychologist
from services.session_service import (
    get_sessions_for_psychologist,
    get_sessions_for_user,
)


router = APIRouter()


@router.get(
    "/user/sessions",
    response_model=SessionListResponse,
)
async def read_user_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.CLIENT)),
    lang: Language = Query(default=Language.UKRAINIAN),
):
    bookings = await get_sessions_for_user(
        db=db,
        user_id=current_user.id,
    )

    items = [
        SessionResponse.model_validate(
            {
                "id": booking.id,
                "selected_time": booking.selected_time,
                "status": booking.status,
                "payment_status": booking.payment_status,
                "price": booking.price,
                "currency": booking.currency,
                "meet_link": booking.meet_link,
                "psychologist": build_booking_psychologist(
                    booking.psychologist,
                    lang,
                ),
            }
        )
        for booking in bookings
    ]

    return SessionListResponse(items=items, total=len(items))


@router.get(
    "/psychologist/sessions",
    response_model=SessionListResponse,
)
async def read_psychologist_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.PSYCHOLOGIST)
    ),
    lang: Language = Query(default=Language.UKRAINIAN),
):
    bookings = await get_sessions_for_psychologist(
        db=db,
        psychologist_id=current_user.id,
    )

    items = [
        SessionResponse.model_validate(
            {
                "id": booking.id,
                "selected_time": booking.selected_time,
                "status": booking.status,
                "payment_status": booking.payment_status,
                "price": booking.price,
                "currency": booking.currency,
                "meet_link": booking.meet_link,
                "psychologist": build_booking_psychologist(
                    booking.psychologist,
                    lang,
                ),
                "client": booking.client,
            }
        )
        for booking in bookings
    ]

    return SessionListResponse(items=items, total=len(items))
