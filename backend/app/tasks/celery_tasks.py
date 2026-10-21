import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select, func

from tasks.celery_app import app
from database.models.models import Booking, BookingStatus
from database import get_postgresql_db_contextmanager_celery_task
from services.booking_service import expire_pending_bookings

logger = logging.getLogger(__name__)


@app.task
def expire_pending_bookings_task():
    """Cancel pending bookings whose holds have expired."""
    return asyncio.run(_expire_pending_bookings())


async def _expire_pending_bookings() -> int:
    async with get_postgresql_db_contextmanager_celery_task() as db:
        now = datetime.now(timezone.utc)
        expired_count = await expire_pending_bookings(db, now)

        logger.info(
            "Expired pending bookings task completed: cancelled=%s",
            expired_count,
        )
        return expired_count


@app.task
def payout_monthly_salary_task():
    pass


@app.task()
def test_task():
    asyncio.run(_count_bookings())


async def _count_bookings():
    async with get_postgresql_db_contextmanager_celery_task() as db:
        stmt = select(func.count(Booking.id)).where(
            Booking.status == BookingStatus.CONFIRMED
        )
        result = (await db.execute(stmt)).scalar()
        logger.info("Test task: %s confirmed bookings", result)
