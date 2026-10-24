import asyncio
import logging
from datetime import datetime, timezone

from tasks.celery_app import app
from database import get_postgresql_db_contextmanager_celery_task
from services.booking_service import (
    expire_pending_bookings,
    complete_session_with_psychologist
)
from config.settings import Settings
from services.payment_service import payout_service
from exceptions.payments import PaymentProviderError
from payment_provider.factory import build_payment_provider


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
    asyncio.run(_payout_monthly_salary_task())


async def _payout_monthly_salary_task():
    settings = Settings()
    try:
        payment_provider = build_payment_provider(
            name=settings.PAYMENT_PROVIDER,
            settings=settings
        )
    except PaymentProviderError as e:
        logger.error("Monthly payout not started: payment provider is not configured (%s)", e)
        return
    async with get_postgresql_db_contextmanager_celery_task() as db:
        await payout_service(
            db=db,
            payment_provider=payment_provider,
            settings=settings
        )


@app.task
def complete_session_with_psychologist_task():
    asyncio.run(
        _complete_session_with_psychologist_task()
    )


async def _complete_session_with_psychologist_task():
    settings = Settings()
    async with get_postgresql_db_contextmanager_celery_task() as db:
        now = datetime.now(timezone.utc)
        count_bookings_completed = await complete_session_with_psychologist(
            db=db,
            now=now,
            session_time_min=settings.SESSION_DURATION_MIN
        )
        logger.info(
            "Session completion task: %s bookings completed",
            count_bookings_completed,
        )
        return count_bookings_completed
