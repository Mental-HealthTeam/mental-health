
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user, require_roles
from config.dependencies import get_settings, get_payment_provider
from config.settings import Settings
from database import get_db
from database.models.models import BookingStatus, User, UserRole
from services.booking_service import (
    create_booking,
    get_booking_for_user,
    list_bookings_for_user,
    mark_disputed,
    resolve_dispute,
)
from schemas.booking import (
    BookingCreateRequest,
    BookingListResponse,
    BookingResponse,
    DisputeRequest,
    ResolveDisputeRequest,
    BookingCancelRequest,
)
from payment_provider.payment_interface import PaymentProviderInterface
from services.payment_service import cancel_booking_service


router = APIRouter()


NOT_AUTHENTICATED = {"description": "Not authenticated"}
NOT_ALLOWED = {"description": "Not enough permissions"}
NOT_FOUND = {"description": "Booking not found"}
WRONG_STATE = {
    "description": "Action is not allowed for the current booking state"
}


SPECIALIZATION_TRANSLATIONS = {
    "uk": {
        "anxiety": "Тривога",
        "burnout": "Вигорання",
        "relationship": "Стосунки",
        "stress": "Стрес",
        "grief": "Втрата",
        "self_esteem": "Самооцінка",
        "low_mood": "Пригнічений настрій",
        "sleep": "Сон",
        "family": "Сім'я",
        "anger": "Гнів",
        "trauma": "Травма",
        "addiction": "Залежність",
        "eating": "Порушення харчової поведінки",
        "loneliness": "Самотність",
        "identity": "Ідентичність",
        "work_career": "Робота та кар'єра",
        "motivation": "Мотивація",
    },
    "en": {
        "anxiety": "Anxiety",
        "burnout": "Burnout",
        "relationship": "Relationships",
        "stress": "Stress",
        "grief": "Grief",
        "self_esteem": "Self-esteem",
        "low_mood": "Low mood",
        "sleep": "Sleep",
        "family": "Family",
        "anger": "Anger",
        "trauma": "Trauma",
        "addiction": "Addiction",
        "eating": "Eating disorders",
        "loneliness": "Loneliness",
        "identity": "Identity",
        "work_career": "Work & career",
        "motivation": "Motivation",
    },
}


def get_localized_psychologist(psychologist, lang: str) -> dict:
    """
    Build localized psychologist data for a booking response.
    English values fall back to Ukrainian when translations are missing.
    """
    if lang == "en":
        full_name = (
            getattr(psychologist, "full_name_eng", None)
            or psychologist.full_name
        )
        title = (
            getattr(psychologist, "title_eng", None)
            or psychologist.title
        )
    else:
        full_name = (
            psychologist.full_name
            or getattr(psychologist, "full_name_eng", None)
        )
        title = (
            psychologist.title
            or getattr(psychologist, "title_eng", None)
        )

    translations = SPECIALIZATION_TRANSLATIONS[lang]

    specializations = []

    for item in psychologist.psychologist_specializations:
        symptom_code = item.symptom_code
        symptom_code = getattr(symptom_code, "value", symptom_code)

        translated_name = translations.get(
            symptom_code,
            symptom_code.replace("_", " ").title(),
        )

        specializations.append(translated_name)

    return {
        "psychologist_id": psychologist.psychologist_id,
        "display_full_name": full_name,
        "display_title": title,
        "display_specializations": specializations,
        "experience_years": psychologist.experience_years,
        "is_verified": psychologist.is_verified,
        "avatar_url": psychologist.avatar_url,
    }


@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a booking and reserve the slot",
    responses={
        401: NOT_AUTHENTICATED,
        422: {"description": "Invalid booking data"},
        409: {"description": "The time slot is already taken"},
    },
)
async def create_booking_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    current_user: Annotated[User, Depends(get_current_user)],
    data: BookingCreateRequest,
):
    return await create_booking(
        db=db,
        settings=settings,
        client=current_user,
        data=data,
    )


@router.get(
    "",
    response_model=BookingListResponse,
    status_code=status.HTTP_200_OK,
    summary="List my bookings",
    responses={
        401: NOT_AUTHENTICATED,
    },
)
async def list_my_bookings(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    booking_status: Annotated[
        BookingStatus | None,
        Query(alias="status"),
    ] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    bookings, total = await list_bookings_for_user(
        db=db,
        user=current_user,
        booking_status=booking_status,
        limit=limit,
        offset=offset,
    )

    return {
        "items": bookings,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get(
    "/{booking_id}",
    response_model=BookingResponse,
    status_code=status.HTTP_200_OK,
    summary="Get one booking",
    responses={
        401: NOT_AUTHENTICATED,
        404: NOT_FOUND,
    },
)
async def get_booking_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    booking_id: UUID,
    lang: Annotated[
        str,
        Query(pattern="^(uk|en)$"),
    ] = "uk",
):
    booking = await get_booking_for_user(
        db=db,
        booking_id=booking_id,
        user=current_user,
    )

    return {
        "id": booking.id,
        "psychologist": get_localized_psychologist(
            psychologist=booking.psychologist,
            lang=lang,
        ),
        "selected_time": booking.selected_time,
        "status": booking.status,
        "payment_status": booking.payment_status,
        "price": booking.price,
        "currency": booking.currency,
        "selection_source": booking.selection_source,
        "ai_session_id": booking.ai_session_id,
        "hold_expires_at": booking.hold_expires_at,
        "meet_link": booking.meet_link,
    }


@router.post(
    "/{booking_id}/cancel",
    response_model=BookingResponse,
    status_code=status.HTTP_200_OK,
    summary="Cancel a booking before the session",
    responses={
        401: NOT_AUTHENTICATED,
        403: NOT_ALLOWED,
        404: NOT_FOUND,
        409: WRONG_STATE,
    },
)
async def cancel_booking_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    current_user: Annotated[User, Depends(get_current_user)],
    payment_provider: Annotated[
        PaymentProviderInterface,
        Depends(get_payment_provider),
    ],
    booking_id: UUID,
    data: BookingCancelRequest | None = None,
):
    confirm_no_refund = data.confirm_no_refund if data else False

    return await cancel_booking_service(
        db=db,
        payment_provider=payment_provider,
        user=current_user,
        settings=settings,
        booking_id=booking_id,
        confirm_no_refund=confirm_no_refund,
    )


@router.post(
    "/{booking_id}/dispute",
    response_model=BookingResponse,
    status_code=status.HTTP_200_OK,
    summary="Mark a booking as disputed (admin)",
    responses={
        401: NOT_AUTHENTICATED,
        403: NOT_ALLOWED,
        404: NOT_FOUND,
        409: WRONG_STATE,
    },
)
async def dispute_booking_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[
        User,
        Depends(require_roles(UserRole.ADMIN)),
    ],
    booking_id: UUID,
    data: DisputeRequest,
):
    return await mark_disputed(
        db=db,
        booking_id=booking_id,
        admin=admin,
        note=data.note,
    )


@router.post(
    "/{booking_id}/resolve-dispute",
    response_model=BookingResponse,
    status_code=status.HTTP_200_OK,
    summary="Resolve a disputed booking (admin)",
    responses={
        401: NOT_AUTHENTICATED,
        403: NOT_ALLOWED,
        404: NOT_FOUND,
        409: WRONG_STATE,
    },
)
async def resolve_dispute_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: Annotated[
        User,
        Depends(require_roles(UserRole.ADMIN)),
    ],
    payment_provider: Annotated[
        PaymentProviderInterface,
        Depends(get_payment_provider),
    ],
    booking_id: UUID,
    data: ResolveDisputeRequest,
):
    return await resolve_dispute(
        db=db,
        payment_provider=payment_provider,
        booking_id=booking_id,
        new_status=data.new_status,
        admin=admin,
    )
