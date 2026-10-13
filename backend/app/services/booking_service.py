
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from database.models.models import BookingStatus, SelectionSource
from schemas.schemas import BookingCreate, BookingResponse
from services.booking_service import (
    create_booking,
    get_booking,
    list_bookings,
    update_booking_status,
)

router = APIRouter()


@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_booking_endpoint(
    payload: BookingCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        selection_source = SelectionSource(payload.selection_source)

        return await create_booking(
            db,
            client_id=payload.client_id,
            psychologist_id=payload.psychologist_id,
            selected_time=payload.selected_time,
            selection_source=selection_source,
            ai_session_id=payload.ai_session_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get("", response_model=list[BookingResponse])
async def get_bookings_endpoint(
    client_id: UUID | None = None,
    psychologist_id: UUID | None = None,
    booking_status: BookingStatus | None = Query(
        default=None,
        alias="status",
    ),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    return await list_bookings(
        db,
        client_id=client_id,
        psychologist_id=psychologist_id,
        status=booking_status,
        limit=limit,
        offset=offset,
    )


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking_endpoint(
    booking_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    booking = await get_booking(db, booking_id)

    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    return booking


@router.patch("/{booking_id}/status", response_model=BookingResponse)
async def update_booking_status_endpoint(
    booking_id: UUID,
    new_status: BookingStatus,
    db: AsyncSession = Depends(get_db),
):
    booking = await get_booking(db, booking_id)

    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    try:
        return await update_booking_status(
            db,
            booking,
            new_status,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
