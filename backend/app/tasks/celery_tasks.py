import asyncio
import logging
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
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
from database.models.models import Psychologist

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


@app.task
def refresh_psychologist_slots():
    return asyncio.run(
        _refresh_psychologist_slots()
    )


async def _refresh_psychologist_slots():
    settings = Settings()
    errors_count = 0
    now = datetime.now(tz=ZoneInfo(settings.CELERY_TIMEZONE))
    async with get_postgresql_db_contextmanager_celery_task() as db:
        stmt = select(Psychologist)
        psychologists = (await db.execute(stmt)).scalars().all()

        if not psychologists:
            return
        for psychologist in psychologists:
            psychologist_id = psychologist.psychologist_id
            try:
                mock_slot_copy = (psychologist.mock_slots or []).copy()
                result_mock_slots = []
                for mock_slot in mock_slot_copy:
                    old_time = datetime.fromisoformat(mock_slot).astimezone(ZoneInfo(settings.CELERY_TIMEZONE))
                    if old_time < now:
                        new_time = old_time + timedelta(days=21)
                        limit_time = (now + timedelta(days=21))
                        while (
                            new_time < now or
                            (new_time < limit_time and
                             new_time.isoformat() in result_mock_slots)
                        ):
                            new_time = new_time + timedelta(days=7)
                        if (
                            new_time.isoformat() not in result_mock_slots and
                            new_time < limit_time
                        ):
                            result_mock_slots.append(new_time.isoformat())
                    else:
                        if mock_slot not in result_mock_slots:
                            result_mock_slots.append(mock_slot)
                result_mock_slots.sort(key=datetime.fromisoformat)
                psychologist.mock_slots = result_mock_slots
                await db.commit()
            except SQLAlchemyError:
                await db.rollback()
                errors_count += 1
                logger.exception(
                    "Slot refresh: database error for psychologist %s",
                    psychologist_id,
                )
                if errors_count > 3:
                    logger.error("Slot refresh aborted: too many errors")
                    break
            except ValueError:
                errors_count += 1
                logger.exception(
                    "Slot refresh: invalid slot value for psychologist %s",
                    psychologist_id,
                )
                if errors_count > 3:
                    logger.error("Slot refresh aborted: too many errors")
                    break

        logger.info(
            "Slot refresh finished: psychologists=%s errors=%s",
            len(psychologists),
            errors_count,
        )
