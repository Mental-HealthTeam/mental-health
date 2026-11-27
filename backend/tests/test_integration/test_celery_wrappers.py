import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.exc import SQLAlchemyError

import tasks.celery_tasks as celery_tasks
from database.models.models import BookingStatus
from tasks.celery_tasks import (
    _complete_session_with_psychologist_task,
    _expire_pending_bookings,
)


async def test_expire_task_wrapper_returns_count(
    client_user, psychologist, make_booking, reload
):
    booking = await make_booking(
        client_user, psychologist,
        hold_expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
    )

    count = await _expire_pending_bookings()

    assert count == 1
    await reload(booking)
    assert booking.status == BookingStatus.CANCELLED


async def test_complete_task_wrapper_completes_finished_sessions(
    client_user, psychologist, make_paid_booking, reload
):
    booking = await make_paid_booking(
        client_user, psychologist,
        selected_time=datetime.now(timezone.utc) - timedelta(hours=3),
    )

    count = await _complete_session_with_psychologist_task()

    assert count == 1
    await reload(booking)
    assert booking.status == BookingStatus.COMPLETED


async def test_complete_task_wrapper_logs_database_error_and_does_not_raise(
    client_user, psychologist, make_paid_booking, reload, monkeypatch, caplog
):
    booking = await make_paid_booking(
        client_user, psychologist,
        selected_time=datetime.now(timezone.utc) - timedelta(hours=3),
    )

    async def failing_completion(**kwargs):
        raise SQLAlchemyError("database is down")

    monkeypatch.setattr(
        celery_tasks, "complete_session_with_psychologist", failing_completion
    )

    with caplog.at_level(logging.ERROR, logger=celery_tasks.logger.name):
        result = await _complete_session_with_psychologist_task()

    assert result is None
    assert "Session completion task failed" in caplog.text
    assert "database is down" in caplog.text
    await reload(booking)
    assert booking.status == BookingStatus.CONFIRMED
    assert booking.request is None
