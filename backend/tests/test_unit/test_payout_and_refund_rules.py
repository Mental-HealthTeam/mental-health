from datetime import datetime, timedelta, timezone
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

import pytest

from database.models.models import UserRole
from exceptions.base import AppError
from services.payment_service import _calculate_payout, _refund_allowed


def booking_with_price(price: str):
    return SimpleNamespace(id=uuid4(), price=Decimal(price))


def test_calculate_payout_basic():
    booking = booking_with_price("1000")

    total, sums = _calculate_payout([booking], fee_percent=20)

    assert total == Decimal("800.00")
    assert sums[booking.id] == (Decimal("800.00"), Decimal("200.00"))


def test_calculate_payout_rounds_half_up():
    booking = booking_with_price("10.05")

    total, sums = _calculate_payout([booking], fee_percent=10)

    assert sums[booking.id] == (Decimal("9.04"), Decimal("1.01"))
    assert total == Decimal("9.04")


def test_calculate_payout_sums_all_bookings():
    bookings = [booking_with_price(p) for p in ("1000", "500", "250")]

    total, sums = _calculate_payout(bookings, fee_percent=20)

    assert total == Decimal("1400.00")
    assert set(sums) == {b.id for b in bookings}


@pytest.mark.parametrize(
    "fee,expected", [(0, Decimal("1000")), (100, Decimal("0"))]
)
def test_calculate_payout_fee_extremes(fee, expected):
    booking = booking_with_price("1000")

    total, _ = _calculate_payout([booking], fee_percent=fee)

    assert total == expected


NOW = datetime(2026, 12, 1, 12, 0, tzinfo=timezone.utc)
SETTINGS = SimpleNamespace(BOOKING_FREE_CANCEL_HOURS=24)


def allowed(role, hours_ahead, confirm=False):
    user = SimpleNamespace(role=role)
    booking = SimpleNamespace(selected_time=NOW + hours_ahead)
    return _refund_allowed(user, booking, NOW, SETTINGS, confirm)


def test_refund_allowed_for_client_when_early():
    assert allowed(UserRole.CLIENT, timedelta(hours=25)) is True


def test_refund_exactly_free_hours_before_is_allowed():
    assert allowed(UserRole.CLIENT, timedelta(hours=24)) is True


def test_client_late_cancel_needs_confirmation():
    with pytest.raises(AppError) as error:
        allowed(UserRole.CLIENT, timedelta(hours=23, minutes=59))

    assert error.value.code == "CANCEL_NO_REFUND_CONFIRM_REQUIRED"
    assert error.value.extra["free_cancel_hours"] == 24


def test_client_late_cancel_confirmed_means_no_refund():
    assert allowed(UserRole.CLIENT, timedelta(hours=1), confirm=True) is False


@pytest.mark.parametrize("role", [UserRole.PSYCHOLOGIST, UserRole.ADMIN])
def test_staff_always_gets_refund(role):
    assert allowed(role, timedelta(hours=1)) is True


@pytest.mark.parametrize("role", list(UserRole))
def test_started_session_cannot_be_cancelled(role):
    with pytest.raises(AppError) as error:
        allowed(role, timedelta(minutes=-1))

    assert error.value.code == "CANCEL_SESSION_STARTED"
