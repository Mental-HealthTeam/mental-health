
from uuid import UUID

from fastapi import APIRouter

router = APIRouter()


@router.post("")
async def create_booking():
    pass


@router.get("")
async def get_bookings():
    pass


@router.get("/{booking_id}")
async def get_booking(booking_id: UUID):
    pass


@router.patch("/{booking_id}/status")
async def update_booking_status(booking_id: UUID):
    pass


@router.delete("/{booking_id}")
async def cancel_booking(booking_id: UUID):
    pass

