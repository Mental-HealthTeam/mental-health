from datetime import datetime, timezone
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    Query,
    status
)
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import require_roles
from config.dependencies import get_settings
from config.settings import BaseAppSettings
from database import get_db
from database.models.models import Language, User, UserRole
from schemas.session import (
    FreeSlotListResponse,
    SessionListResponse,
    SessionPsychologistResponse,
    SessionPsychologistListResponse,
    SessionResponse,
    SessionSavedResponse, AllSessionPsychologist,
)
from services.booking_localization import build_booking_psychologist
from services.session_service import (
    get_sessions_for_psychologist,
    get_sessions_for_user,
    sort_all_sessions,
    get_scheduled_sessions_for_user,
    get_completed_sessions_for_user,
    get_saved_sessions_for_user,
    set_session_saved,
    sort_completed_sessions,
    sort_scheduled_sessions,
    get_completed_sessions_for_psychologist,
)
from services.slot_service import get_free_slots_for_psychologist

router = APIRouter()


@router.get(
    "/user/sessions",
    status_code=status.HTTP_200_OK,
    response_model=SessionListResponse,
)
async def read_user_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.CLIENT)),
    settings: BaseAppSettings = Depends(
        get_settings
    ),
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
                "saved": booking.saved
            }
        )
        for booking in bookings
    ]
    now = datetime.now(timezone.utc)
    items.sort(key=lambda session: sort_all_sessions(
        now, session, settings.SESSION_DURATION_MIN
    ))

    return SessionListResponse(items=items, total=len(items))


@router.get(
    "/psychologist/sessions",
    status_code=status.HTTP_200_OK,
    response_model=AllSessionPsychologist,
)
async def read_psychologist_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.PSYCHOLOGIST)
    ),
    lang: Language = Query(default=Language.UKRAINIAN),
) -> AllSessionPsychologist:
    bookings = await get_sessions_for_psychologist(
        db=db,
        psychologist_id=current_user.id,
    )

    booked_items = [
        SessionPsychologistResponse.model_validate(
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
                "request": booking.request if booking.request is not None else [
                    topic.symptom_code
                    for topic in booking.client.user_symptom_codes
                ],
                "saved": booking.saved,
                "client": booking.client,
            }
        )
        for booking in bookings
    ]

    free_slots = await get_free_slots_for_psychologist(
        db=db,
        psychologist_id=current_user.id
    )

    return AllSessionPsychologist(
        booked_items=booked_items,
        free_slots=free_slots,
        total=len(booked_items) + len(free_slots)
    )


@router.get(
    "/psychologist/sessions/completed",
    status_code=status.HTTP_200_OK,
    response_model=SessionPsychologistListResponse,
)
async def read_psychologist_completed_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.PSYCHOLOGIST)
    ),
    settings: BaseAppSettings = Depends(
        get_settings
    ),
    lang: Language = Query(default=Language.UKRAINIAN),
):
    now = datetime.now(timezone.utc)
    bookings = await get_completed_sessions_for_psychologist(
        db=db,
        psychologist_id=current_user.id,
        settings=settings,
        now=now
    )

    items = [
        SessionPsychologistResponse.model_validate(
            {
                "id": booking.id,
                "selected_time": booking.selected_time,
                "status": booking.status,
                "payment_status": booking.payment_status,
                "price": booking.price,
                "currency": booking.currency,
                "psychologist": build_booking_psychologist(
                    booking.psychologist,
                    lang,
                ),
                "request": booking.request if booking.request is not None else [
                    topic.symptom_code
                    for topic in booking.client.user_symptom_codes
                ],
                "client": booking.client,
            }
        )
        for booking in bookings
    ]

    return SessionPsychologistListResponse(items=items, total=len(items))


@router.get(
    "/psychologist/sessions/free",
    status_code=status.HTTP_200_OK,
    response_model=FreeSlotListResponse
)
async def read_psychologist_free_slots(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(
            require_roles(UserRole.PSYCHOLOGIST)
        )
) -> FreeSlotListResponse:
    free_slots = await get_free_slots_for_psychologist(
        db=db,
        psychologist_id=current_user.id
    )

    return FreeSlotListResponse(
        items=free_slots,
        total=len(free_slots)
    )


@router.get(
    "/user/sessions/scheduled",
    status_code=status.HTTP_200_OK,
    response_model=SessionListResponse
)
async def read_user_scheduled_sessions(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(
            require_roles(UserRole.CLIENT)
        ),
        settings: BaseAppSettings = Depends(
            get_settings
        ),
        lang: Language = Query(default=Language.UKRAINIAN),
) -> SessionListResponse:
    now = datetime.now(timezone.utc)

    bookings = await get_scheduled_sessions_for_user(
        db=db,
        current_user=current_user,
        now=now,
        settings=settings
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
                "saved": booking.saved
            }
        )
        for booking in bookings
    ]

    items.sort(key=lambda session: sort_scheduled_sessions(now, session))

    return SessionListResponse(items=items, total=len(items))


@router.get(
    "/user/sessions/completed",
    status_code=status.HTTP_200_OK,
    response_model=SessionListResponse
)
async def read_user_completed_sessions(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(
            require_roles(UserRole.CLIENT)
        ),
        settings: BaseAppSettings = Depends(
            get_settings
        ),
        lang: Language = Query(default=Language.UKRAINIAN),
) -> SessionListResponse:
    now = datetime.now(timezone.utc)

    bookings = await get_completed_sessions_for_user(
        db=db,
        current_user=current_user,
        now=now,
        settings=settings
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
                "saved": booking.saved
            }
        )
        for booking in bookings
    ]

    items.sort(key=lambda session: sort_completed_sessions(now, session))

    return SessionListResponse(items=items, total=len(items))


@router.get(
    "/user/sessions/saved",
    status_code=status.HTTP_200_OK,
    response_model=SessionListResponse
)
async def read_user_saved_sessions(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(
            require_roles(UserRole.CLIENT)
        ),
        settings: BaseAppSettings = Depends(
            get_settings
        ),
        lang: Language = Query(default=Language.UKRAINIAN),
) -> SessionListResponse:
    now = datetime.now(timezone.utc)

    bookings = await get_saved_sessions_for_user(
        db=db,
        current_user=current_user
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
                "saved": booking.saved
            }
        )
        for booking in bookings
    ]

    items.sort(key=lambda session: sort_all_sessions(
        now, session, settings.SESSION_DURATION_MIN
    ))

    return SessionListResponse(items=items, total=len(items))


@router.post(
    "/user/sessions/{booking_id}/save",
    status_code=status.HTTP_200_OK,
    response_model=SessionSavedResponse
)
async def save_user_session(
    booking_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.CLIENT)
    )
) -> SessionSavedResponse:
    return await set_session_saved(
        booking_id=booking_id,
        is_saved=True,
        db=db,
        current_user=current_user
    )


@router.delete(
    "/user/sessions/{booking_id}/save",
    status_code=status.HTTP_200_OK,
    response_model=SessionSavedResponse
)
async def unsave_user_session(
    booking_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.CLIENT)
    )
) -> SessionSavedResponse:
    return await set_session_saved(
        booking_id=booking_id,
        is_saved=False,
        db=db,
        current_user=current_user
    )
