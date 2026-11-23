from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from sqlalchemy import select

from database.models.models import (
    BookingStatus,
    PaymentStatus,
    Psychologist,
    PsychologistStatus,
)
from exceptions.payments import PaymentProviderError
from payment_provider.payment_types import PayoutStatus
from services.booking_service import (
    complete_session_with_psychologist,
    expire_pending_bookings,
)
from services.payment_service import payout_service


async def test_expire_cancels_expired_holds(
    client_user, psychologist, make_booking, db_session, reload, slot
):
    now = datetime.now(timezone.utc)
    first = await make_booking(
        client_user, psychologist, selected_time=slot(2, 10),
        hold_expires_at=now - timedelta(minutes=5),
    )
    second = await make_booking(
        client_user, psychologist, selected_time=slot(3, 10),
        hold_expires_at=now - timedelta(seconds=1),
    )

    count = await expire_pending_bookings(db_session, now)

    assert count == 2
    for booking in (first, second):
        await reload(booking)
        assert booking.status == BookingStatus.CANCELLED
        assert booking.payment_status == PaymentStatus.UNPAID


async def test_expire_ignores_fresh_and_other_bookings(
    client_user, psychologist, make_booking, make_paid_booking, db_session,
    reload, slot,
):
    now = datetime.now(timezone.utc)
    fresh = await make_booking(
        client_user, psychologist, selected_time=slot(2, 10),
        hold_expires_at=now + timedelta(minutes=10),
    )
    paid = await make_paid_booking(
        client_user, psychologist, selected_time=slot(3, 10),
        hold_expires_at=now - timedelta(minutes=10),
    )

    count = await expire_pending_bookings(db_session, now)

    assert count == 0
    await reload(fresh)
    await reload(paid)
    assert fresh.status == BookingStatus.PENDING
    assert paid.status == BookingStatus.CONFIRMED


async def test_expire_boundary_equal_to_now_is_cancelled(
    client_user, psychologist, make_booking, db_session, reload
):
    now = datetime.now(timezone.utc)
    booking = await make_booking(client_user, psychologist, hold_expires_at=now)

    count = await expire_pending_bookings(db_session, now)

    assert count == 1
    await reload(booking)
    assert booking.status == BookingStatus.CANCELLED


async def test_expire_frees_slot(
    client, client_user, other_client, client_headers, psychologist,
    make_booking, db_session, auth_headers, slot,
):
    now = datetime.now(timezone.utc)
    await make_booking(
        client_user, psychologist, selected_time=slot(2, 10),
        hold_expires_at=now - timedelta(minutes=1),
    )
    await expire_pending_bookings(db_session, now)

    response = await client.post(
        "/api/bookings",
        json={
            "psychologist_id": str(psychologist.psychologist_id),
            "selected_time": slot(2, 10).isoformat(),
        },
        headers=auth_headers(other_client),
    )

    assert response.status_code == 201


async def test_complete_finished_sessions(
    client_user, psychologist, make_paid_booking, db_session, reload, settings
):
    now = datetime.now(timezone.utc)
    booking = await make_paid_booking(
        client_user, psychologist,
        selected_time=now - timedelta(minutes=settings.SESSION_DURATION_MIN + 1),
    )

    count = await complete_session_with_psychologist(
        db=db_session, now=now, session_time_min=settings.SESSION_DURATION_MIN
    )

    assert count == 1
    await reload(booking)
    assert booking.status == BookingStatus.COMPLETED
    assert booking.completed_at == now


async def test_complete_ignores_running_session(
    client_user, psychologist, make_paid_booking, db_session, reload, settings
):
    now = datetime.now(timezone.utc)
    booking = await make_paid_booking(
        client_user, psychologist, selected_time=now - timedelta(minutes=10)
    )

    count = await complete_session_with_psychologist(
        db=db_session, now=now, session_time_min=settings.SESSION_DURATION_MIN
    )

    assert count == 0
    await reload(booking)
    assert booking.status == BookingStatus.CONFIRMED


async def test_complete_boundary_session_ends_exactly_now(
    client_user, psychologist, make_paid_booking, db_session, reload, settings
):
    now = datetime.now(timezone.utc)
    booking = await make_paid_booking(
        client_user, psychologist,
        selected_time=now - timedelta(minutes=settings.SESSION_DURATION_MIN),
    )

    count = await complete_session_with_psychologist(
        db=db_session, now=now, session_time_min=settings.SESSION_DURATION_MIN
    )

    assert count == 1
    await reload(booking)
    assert booking.status == BookingStatus.COMPLETED


async def test_complete_ignores_other_statuses(
    client_user, psychologist, make_booking, make_paid_booking, db_session,
    settings, slot,
):
    now = datetime.now(timezone.utc)
    old = now - timedelta(hours=5)
    await make_booking(
        client_user, psychologist, selected_time=old - timedelta(days=1),
        status=BookingStatus.CANCELLED,
    )
    await make_paid_booking(
        client_user, psychologist, status=BookingStatus.DISPUTED,
        selected_time=old - timedelta(days=2),
    )
    await make_booking(
        client_user, psychologist, status=BookingStatus.CONFIRMED,
        payment_status=PaymentStatus.UNPAID, selected_time=old - timedelta(days=3),
    )

    count = await complete_session_with_psychologist(
        db=db_session, now=now, session_time_min=settings.SESSION_DURATION_MIN
    )

    assert count == 0


async def completed_booking(make_paid_booking, client_user, psychologist, when, price):
    return await make_paid_booking(
        client_user, psychologist, status=BookingStatus.COMPLETED,
        selected_time=when, price=price,
    )


async def test_payout_success(
    client_user, psychologist, make_paid_booking, fake_payment, db_session,
    settings, reload,
):
    now = datetime.now(timezone.utc)
    first = await completed_booking(
        make_paid_booking, client_user, psychologist, now - timedelta(days=10), "1000"
    )
    second = await completed_booking(
        make_paid_booking, client_user, psychologist, now - timedelta(days=9), "1000"
    )

    await payout_service(
        db=db_session, payment_provider=fake_payment, settings=settings
    )

    assert len(fake_payment.payout_calls) == 1
    request = fake_payment.payout_calls[0]
    assert request.amount == Decimal("1600.00")
    assert request.currency == settings.WAYFORPAY_CURRENCY
    assert request.recipient.iban == psychologist.iban
    assert request.recipient.tax_id == psychologist.tax_id
    assert request.reference.startswith(f"payout_{psychologist.psychologist_id}_")
    assert request.reference.endswith("_160000")
    for booking in (first, second):
        await reload(booking)
        assert booking.payment_status == PaymentStatus.PAID
        assert booking.payout_amount == Decimal("800.00")
        assert booking.platform_fee == Decimal("200.00")
        assert booking.released_at is not None


async def test_payout_one_request_per_psychologist(
    client_user, psychologist, make_psychologist, make_paid_booking,
    fake_payment, db_session, settings,
):
    other = await make_psychologist()
    now = datetime.now(timezone.utc)
    await completed_booking(
        make_paid_booking, client_user, psychologist, now - timedelta(days=5), "1000"
    )
    await completed_booking(
        make_paid_booking, client_user, other, now - timedelta(days=5), "500"
    )

    await payout_service(
        db=db_session, payment_provider=fake_payment, settings=settings
    )

    assert len(fake_payment.payout_calls) == 2
    assert sorted(c.amount for c in fake_payment.payout_calls) == [
        Decimal("400.00"), Decimal("800.00")
    ]


async def test_payout_takes_only_completed_held_without_reference(
    client_user, psychologist, make_paid_booking, fake_payment, db_session,
    settings,
):
    now = datetime.now(timezone.utc)
    await make_paid_booking(
        client_user, psychologist, status=BookingStatus.DISPUTED,
        selected_time=now - timedelta(days=5),
    )
    await make_paid_booking(
        client_user, psychologist, status=BookingStatus.CONFIRMED,
        selected_time=now - timedelta(days=6),
    )
    await make_paid_booking(
        client_user, psychologist, status=BookingStatus.COMPLETED,
        payment_status=PaymentStatus.PAID, selected_time=now - timedelta(days=7),
    )
    await make_paid_booking(
        client_user, psychologist, status=BookingStatus.COMPLETED,
        payout_reference="already-set", selected_time=now - timedelta(days=8),
    )

    await payout_service(
        db=db_session, payment_provider=fake_payment, settings=settings
    )

    assert fake_payment.payout_calls == []


async def test_payout_nothing_to_pay(fake_payment, db_session, settings):
    await payout_service(
        db=db_session, payment_provider=fake_payment, settings=settings
    )

    assert fake_payment.payout_calls == []


async def test_payout_skips_inactive_psychologist(
    client_user, make_psychologist, make_paid_booking, fake_payment, db_session,
    settings, reload,
):
    frozen = await make_psychologist(status=PsychologistStatus.FROZEN)
    booking = await completed_booking(
        make_paid_booking, client_user, frozen,
        datetime.now(timezone.utc) - timedelta(days=5), "1000",
    )

    await payout_service(
        db=db_session, payment_provider=fake_payment, settings=settings
    )

    assert fake_payment.payout_calls == []
    await reload(booking)
    assert booking.payout_reference is None
    assert booking.payment_status == PaymentStatus.HELD


async def test_payout_skipped_when_fee_is_not_positive(
    client_user, psychologist, make_paid_booking, fake_payment, db_session,
    settings,
):
    await completed_booking(
        make_paid_booking, client_user, psychologist,
        datetime.now(timezone.utc) - timedelta(days=5), "1000",
    )
    broken = type(settings).model_construct(**settings.model_dump())
    broken.PLATFORM_FEE_PERCENT = 0

    await payout_service(
        db=db_session, payment_provider=fake_payment, settings=broken
    )

    assert fake_payment.payout_calls == []


async def test_payout_provider_error_releases_reference(
    client_user, psychologist, make_paid_booking, fake_payment, db_session,
    settings, reload,
):
    fake_payment.payout_error = PaymentProviderError("down")
    booking = await completed_booking(
        make_paid_booking, client_user, psychologist,
        datetime.now(timezone.utc) - timedelta(days=5), "1000",
    )

    await payout_service(
        db=db_session, payment_provider=fake_payment, settings=settings
    )

    await reload(booking)
    assert booking.payout_reference is None
    assert booking.status == BookingStatus.COMPLETED
    assert booking.payment_status == PaymentStatus.HELD


async def test_payout_is_not_repeated(
    client_user, psychologist, make_paid_booking, fake_payment, db_session,
    settings,
):
    await completed_booking(
        make_paid_booking, client_user, psychologist,
        datetime.now(timezone.utc) - timedelta(days=5), "1000",
    )

    await payout_service(
        db=db_session, payment_provider=fake_payment, settings=settings
    )
    await payout_service(
        db=db_session, payment_provider=fake_payment, settings=settings
    )

    assert len(fake_payment.payout_calls) == 1


@pytest.mark.parametrize("status", [PayoutStatus.PENDING, PayoutStatus.SIMULATED])
async def test_payout_pending_and_simulated_mark_booking_paid(
    client_user, psychologist, make_paid_booking, fake_payment, db_session,
    settings, reload, status,
):
    fake_payment.payout_status = status
    booking = await completed_booking(
        make_paid_booking, client_user, psychologist,
        datetime.now(timezone.utc) - timedelta(days=5), "1000",
    )

    await payout_service(
        db=db_session, payment_provider=fake_payment, settings=settings
    )

    await reload(booking)
    assert booking.payment_status == PaymentStatus.PAID


async def test_payout_stops_after_three_failures_in_a_row(
    client_user, make_psychologist, make_paid_booking, fake_payment, db_session,
    settings,
):
    fake_payment.payout_error = PaymentProviderError("down")
    for _ in range(4):
        person = await make_psychologist()
        await completed_booking(
            make_paid_booking, client_user, person,
            datetime.now(timezone.utc) - timedelta(days=5), "1000",
        )

    await payout_service(
        db=db_session, payment_provider=fake_payment, settings=settings
    )

    assert len(fake_payment.payout_calls) == 3


async def test_payout_invalid_recipient_does_not_stop_run(
    client_user, make_psychologist, make_paid_booking, fake_payment, db_session,
    settings, reload,
):
    broken = await make_psychologist()
    broken_row = await db_session.get(Psychologist, broken.psychologist_id)
    broken_row.iban = "BAD"
    await db_session.commit()
    good = await make_psychologist()
    now = datetime.now(timezone.utc)
    first = await completed_booking(
        make_paid_booking, client_user, broken, now - timedelta(days=5), "1000"
    )
    second = await completed_booking(
        make_paid_booking, client_user, good, now - timedelta(days=5), "1000"
    )

    await payout_service(
        db=db_session, payment_provider=fake_payment, settings=settings
    )

    await reload(first)
    await reload(second)
    assert first.payout_reference is None
    assert second.payment_status == PaymentStatus.PAID
    assert len(fake_payment.payout_calls) == 1
