import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, patch
from zoneinfo import ZoneInfo

import pytest
from freezegun import freeze_time
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.models import (
    Booking,
    BookingStatus,
    PaymentStatus,
    PsychologistStatus,
)
from exceptions.payments import PaymentProviderError
from payment_provider.payment_types import PaymentProviderName

BOOKINGS = "/api/bookings"


def parse(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def create_body(psychologist, when, **extra):
    body = {
        "psychologist_id": str(psychologist.psychologist_id),
        "selected_time": when.isoformat(),
    }
    body.update(extra)
    return body


async def test_create_booking_success(
    client, client_headers, psychologist, slot, fetch
):
    when = slot(2, 10)
    started = datetime.now(timezone.utc)

    response = await client.post(
        BOOKINGS, json=create_body(psychologist, when), headers=client_headers
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "pending"
    assert body["payment_status"] == "unpaid"
    assert Decimal(body["price"]) == psychologist.price_per_hour
    assert body["currency"] == "UAH"
    assert parse(body["selected_time"]) == when
    assert body["meet_link"] is None
    hold = parse(body["hold_expires_at"])
    assert started + timedelta(minutes=19) < hold < started + timedelta(minutes=21)
    assert sorted(body["psychologist"]["specializations"]) == ["anxiety", "stress"]
    assert body["psychologist"]["is_verified"] is True
    assert len(await fetch(select(Booking))) == 1


async def test_create_booking_accepts_other_timezone(
    client, client_headers, psychologist, slot
):
    when = slot(2, 10).astimezone(ZoneInfo("Europe/Kyiv"))

    response = await client.post(
        BOOKINGS, json=create_body(psychologist, when), headers=client_headers
    )

    assert response.status_code == 201


async def test_create_booking_with_ai_session(
    client, client_headers, client_user, psychologist, make_ai_session, slot
):
    await make_ai_session(client_user, "chat-9")

    response = await client.post(
        BOOKINGS,
        json=create_body(psychologist, slot(2, 10), ai_session_id="chat-9"),
        headers=client_headers,
    )

    assert response.status_code == 201
    assert response.json()["ai_session_id"] == "chat-9"


async def test_create_booking_time_in_past(
    client, client_headers, psychologist
):
    when = datetime.now(timezone.utc) - timedelta(hours=1)

    response = await client.post(
        BOOKINGS, json=create_body(psychologist, when), headers=client_headers
    )

    assert response.status_code == 422
    assert response.json()["code"] == "BOOKING_TIME_IN_PAST"


async def test_create_booking_time_too_far(
    client, client_headers, psychologist, settings
):
    when = datetime.now(timezone.utc) + timedelta(
        days=settings.BOOKING_HORIZON_DAYS + 5
    )

    response = await client.post(
        BOOKINGS, json=create_body(psychologist, when), headers=client_headers
    )

    assert response.status_code == 422
    assert response.json()["code"] == "BOOKING_TIME_TOO_FAR"


async def test_create_booking_unknown_psychologist(
    client, client_headers, slot
):
    body = {
        "psychologist_id": str(uuid.uuid4()),
        "selected_time": slot(2, 10).isoformat(),
    }

    response = await client.post(BOOKINGS, json=body, headers=client_headers)

    assert response.status_code == 422
    assert response.json()["code"] == "PSYCHOLOGIST_NOT_AVAILABLE"


async def test_create_booking_inactive_psychologist(
    client, client_headers, make_psychologist, slot
):
    frozen = await make_psychologist(status=PsychologistStatus.FROZEN)

    response = await client.post(
        BOOKINGS, json=create_body(frozen, slot(2, 10)), headers=client_headers
    )

    assert response.status_code == 422
    assert response.json()["code"] == "PSYCHOLOGIST_NOT_AVAILABLE"


async def test_create_booking_time_is_not_a_slot(
    client, client_headers, psychologist, slot
):
    response = await client.post(
        BOOKINGS,
        json=create_body(psychologist, slot(2, 7)),
        headers=client_headers,
    )

    assert response.status_code == 422
    assert response.json()["code"] == "SLOT_NOT_AVAILABLE"


async def test_create_booking_unknown_ai_session(
    client, client_headers, psychologist, slot
):
    response = await client.post(
        BOOKINGS,
        json=create_body(psychologist, slot(2, 10), ai_session_id="nope"),
        headers=client_headers,
    )

    assert response.status_code == 422
    assert response.json()["code"] == "AI_SESSION_NOT_FOUND"


async def test_create_booking_foreign_ai_session(
    client, client_headers, other_client, psychologist, make_ai_session, slot
):
    await make_ai_session(other_client, "chat-x")

    response = await client.post(
        BOOKINGS,
        json=create_body(psychologist, slot(2, 10), ai_session_id="chat-x"),
        headers=client_headers,
    )

    assert response.status_code == 422
    assert response.json()["code"] == "AI_SESSION_NOT_FOUND"


async def test_create_booking_slot_already_booked(
    client, client_headers, other_client, psychologist, make_booking, slot, fetch
):
    taken = slot(2, 10)
    await make_booking(other_client, psychologist, selected_time=taken)

    response = await client.post(
        BOOKINGS, json=create_body(psychologist, taken), headers=client_headers
    )

    assert response.status_code == 409
    body = response.json()
    assert body["code"] == "SLOT_ALREADY_BOOKED"
    assert parse(body["nearest_available_slot"]) == slot(3, 12)
    assert len(await fetch(select(Booking))) == 1


async def test_create_booking_slot_booked_without_alternative(
    client, client_headers, other_client, make_psychologist, make_booking, slot
):
    only = slot(2, 10)
    psychologist = await make_psychologist(slots=[only])
    await make_booking(other_client, psychologist, selected_time=only)

    response = await client.post(
        BOOKINGS, json=create_body(psychologist, only), headers=client_headers
    )

    assert response.status_code == 409
    assert response.json()["nearest_available_slot"] is None


async def test_create_booking_slot_free_after_cancellation(
    client, client_headers, other_client, psychologist, make_booking, slot
):
    when = slot(2, 10)
    await make_booking(
        other_client, psychologist, selected_time=when,
        status=BookingStatus.CANCELLED,
    )

    response = await client.post(
        BOOKINGS, json=create_body(psychologist, when), headers=client_headers
    )

    assert response.status_code == 201


@pytest.mark.parametrize(
    "extra",
    [
        {"unexpected": 1},
        {"ai_session_id": "x" * 51},
        {"psychologist_id": "not-a-uuid"},
        {"selected_time": "2030-01-01T10:00:00"},
    ],
)
async def test_create_booking_validation(
    client, client_headers, psychologist, slot, extra
):
    body = create_body(psychologist, slot(2, 10))
    body.update(extra)

    response = await client.post(BOOKINGS, json=body, headers=client_headers)

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


async def test_create_booking_lang_en(
    client, client_headers, psychologist, slot
):
    response = await client.post(
        BOOKINGS + "?lang=en",
        json=create_body(psychologist, slot(2, 10)),
        headers=client_headers,
    )

    assert response.json()["psychologist"]["full_name"] == "Test Psychologist"
    assert response.json()["psychologist"]["title"] == "Clinical psychologist"


async def test_create_booking_unauthorized(client, psychologist, slot):
    response = await client.post(
        BOOKINGS, json=create_body(psychologist, slot(2, 10))
    )

    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"


async def test_list_bookings_client_sees_only_own(
    client, client_headers, client_user, other_client, psychologist,
    make_booking, slot,
):
    await make_booking(client_user, psychologist, selected_time=slot(2, 10))
    await make_booking(client_user, psychologist, selected_time=slot(3, 12))
    await make_booking(other_client, psychologist, selected_time=slot(4, 10))

    response = await client.get(BOOKINGS, headers=client_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert len(body["items"]) == 2


async def test_list_bookings_psychologist_sees_own_sessions(
    client, psychologist_headers, client_user, psychologist, make_psychologist,
    make_booking, slot,
):
    other = await make_psychologist()
    await make_booking(client_user, psychologist, selected_time=slot(2, 10))
    await make_booking(client_user, other, selected_time=slot(2, 10))

    response = await client.get(BOOKINGS, headers=psychologist_headers)

    assert response.json()["total"] == 1


async def test_list_bookings_admin_sees_all(
    client, admin_headers, client_user, other_client, psychologist,
    make_booking, slot,
):
    await make_booking(client_user, psychologist, selected_time=slot(2, 10))
    await make_booking(other_client, psychologist, selected_time=slot(3, 12))

    response = await client.get(BOOKINGS, headers=admin_headers)

    assert response.json()["total"] == 2


async def test_list_bookings_filter_by_status(
    client, client_headers, client_user, psychologist, make_booking,
    make_paid_booking, slot,
):
    await make_booking(client_user, psychologist, selected_time=slot(2, 10))
    paid = await make_paid_booking(
        client_user, psychologist, selected_time=slot(3, 12)
    )

    response = await client.get(
        BOOKINGS, params={"status": "confirmed"}, headers=client_headers
    )

    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["booking_id"] == str(paid.id)


async def test_list_bookings_pagination_and_order(
    client, client_headers, client_user, psychologist, make_booking, slot
):
    times = [slot(day, 10) for day in range(2, 7)]
    for when in times:
        await make_booking(client_user, psychologist, selected_time=when)

    response = await client.get(
        BOOKINGS, params={"limit": 2, "offset": 2}, headers=client_headers
    )

    body = response.json()
    assert (body["total"], body["limit"], body["offset"]) == (5, 2, 2)
    expected = sorted(times, reverse=True)[2:4]
    assert [parse(i["selected_time"]) for i in body["items"]] == expected


@pytest.mark.parametrize(
    "params",
    [{"limit": 0}, {"limit": 101}, {"offset": -1}, {"status": "nope"}],
)
async def test_list_bookings_invalid_params(client, client_headers, params):
    response = await client.get(BOOKINGS, params=params, headers=client_headers)

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


async def test_list_bookings_meet_link_only_for_paid(
    client, client_headers, client_user, psychologist, make_booking,
    make_paid_booking, slot,
):
    await make_booking(client_user, psychologist, selected_time=slot(2, 10))
    await make_paid_booking(client_user, psychologist, selected_time=slot(3, 12))

    response = await client.get(BOOKINGS, headers=client_headers)

    by_status = {i["status"]: i["meet_link"] for i in response.json()["items"]}
    assert by_status["pending"] is None
    assert by_status["confirmed"] == psychologist.meet_link


async def test_list_bookings_unauthorized(client):
    response = await client.get(BOOKINGS)

    assert response.status_code == 401


async def test_get_booking_allowed_roles(
    client, client_user, client_headers, psychologist, psychologist_headers,
    admin_headers, make_booking,
):
    booking = await make_booking(client_user, psychologist)

    for headers in (client_headers, psychologist_headers, admin_headers):
        response = await client.get(f"{BOOKINGS}/{booking.id}", headers=headers)
        assert response.status_code == 200
        assert response.json()["booking_id"] == str(booking.id)


async def test_get_booking_foreign_client_gets_404(
    client, client_user, other_client, psychologist, make_booking, auth_headers
):
    booking = await make_booking(client_user, psychologist)

    response = await client.get(
        f"{BOOKINGS}/{booking.id}", headers=auth_headers(other_client)
    )

    assert response.status_code == 404
    assert response.json()["code"] == "BOOKING_NOT_FOUND"


async def test_get_booking_not_found(client, client_headers):
    response = await client.get(f"{BOOKINGS}/{uuid.uuid4()}", headers=client_headers)

    assert response.status_code == 404
    assert response.json()["code"] == "BOOKING_NOT_FOUND"


async def test_get_booking_invalid_uuid(client, client_headers):
    response = await client.get(f"{BOOKINGS}/abc", headers=client_headers)

    assert response.status_code == 422


async def test_get_booking_meet_link_by_state(
    client, client_user, client_headers, psychologist, make_booking,
    make_paid_booking, slot,
):
    pending = await make_booking(client_user, psychologist, selected_time=slot(2, 10))
    paid = await make_paid_booking(
        client_user, psychologist, selected_time=slot(3, 12)
    )

    pending_response = await client.get(
        f"{BOOKINGS}/{pending.id}", headers=client_headers
    )
    paid_response = await client.get(f"{BOOKINGS}/{paid.id}", headers=client_headers)

    assert pending_response.json()["meet_link"] is None
    assert paid_response.json()["meet_link"] == psychologist.meet_link


async def test_get_booking_lang_en(
    client, client_user, client_headers, psychologist, make_booking
):
    booking = await make_booking(client_user, psychologist)

    response = await client.get(
        f"{BOOKINGS}/{booking.id}", params={"lang": "en"}, headers=client_headers
    )

    assert response.json()["psychologist"]["full_name"] == "Test Psychologist"


async def test_get_booking_unauthorized(client):
    response = await client.get(f"{BOOKINGS}/{uuid.uuid4()}")

    assert response.status_code == 401


def cancel_url(booking):
    return f"{BOOKINGS}/{booking.id}/cancel"


async def test_cancel_unpaid_booking(
    client, client_user, client_headers, psychologist, make_booking,
    fake_payment, reload,
):
    booking = await make_booking(client_user, psychologist)

    response = await client.post(cancel_url(booking), headers=client_headers)

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"
    assert response.json()["payment_status"] == "unpaid"
    assert fake_payment.refund_calls == []


async def test_cancel_payment_in_progress(
    client, client_user, client_headers, psychologist, make_booking, reload
):
    booking = await make_booking(
        client_user, psychologist, payment_provider=PaymentProviderName.WAYFORPAY
    )

    response = await client.post(cancel_url(booking), headers=client_headers)

    assert response.status_code == 409
    assert response.json()["code"] == "CANCEL_PAYMENT_IN_PROGRESS"
    await reload(booking)
    assert booking.status == BookingStatus.PENDING


async def test_cancel_unpaid_with_expired_hold(
    client, client_user, client_headers, psychologist, make_booking
):
    booking = await make_booking(
        client_user, psychologist,
        payment_provider=PaymentProviderName.WAYFORPAY,
        hold_expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
    )

    response = await client.post(cancel_url(booking), headers=client_headers)

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"


async def test_cancel_already_cancelled_is_idempotent(
    client, client_user, client_headers, psychologist, make_booking, fake_payment
):
    booking = await make_booking(
        client_user, psychologist, status=BookingStatus.CANCELLED
    )

    response = await client.post(cancel_url(booking), headers=client_headers)

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"
    assert fake_payment.refund_calls == []


async def test_cancel_paid_booking_with_refund(
    client, client_user, client_headers, psychologist, make_paid_booking,
    fake_payment, reload, slot,
):
    booking = await make_paid_booking(
        client_user, psychologist, selected_time=slot(3, 10)
    )

    response = await client.post(cancel_url(booking), headers=client_headers)

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"
    assert response.json()["payment_status"] == "refunded"
    assert len(fake_payment.refund_calls) == 1
    refund = fake_payment.refund_calls[0]
    assert refund.amount == booking.price
    assert refund.payment_reference == booking.payment_reference
    assert refund.reason == "Booking canceled"


async def test_cancel_paid_booking_frees_slot(
    client, client_user, client_headers, other_client, psychologist,
    make_paid_booking, auth_headers, slot,
):
    when = slot(3, 10)
    booking = await make_paid_booking(client_user, psychologist, selected_time=when)
    await client.post(cancel_url(booking), headers=client_headers)

    response = await client.post(
        BOOKINGS,
        json=create_body(psychologist, slot(2, 10)),
        headers=auth_headers(other_client),
    )

    assert response.status_code == 201


async def test_cancel_late_requires_confirmation(
    client, client_user, client_headers, psychologist, make_paid_booking,
    fake_payment, reload, settings,
):
    soon = datetime.now(timezone.utc) + timedelta(hours=2)
    booking = await make_paid_booking(client_user, psychologist, selected_time=soon)

    response = await client.post(cancel_url(booking), headers=client_headers)

    assert response.status_code == 409
    body = response.json()
    assert body["code"] == "CANCEL_NO_REFUND_CONFIRM_REQUIRED"
    assert body["free_cancel_hours"] == settings.BOOKING_FREE_CANCEL_HOURS
    assert fake_payment.refund_calls == []
    await reload(booking)
    assert booking.status == BookingStatus.CONFIRMED


async def test_cancel_late_with_confirmation_pays_out_without_refund(
    client, client_user, client_headers, psychologist, make_paid_booking,
    fake_payment, reload,
):
    soon = datetime.now(timezone.utc) + timedelta(hours=2)
    booking = await make_paid_booking(client_user, psychologist, selected_time=soon)

    response = await client.post(
        cancel_url(booking), json={"confirm_no_refund": True}, headers=client_headers
    )

    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    assert response.json()["payment_status"] == "held"
    assert fake_payment.refund_calls == []
    await reload(booking)
    assert booking.completed_at is not None


async def test_cancel_exactly_free_hours_before_still_refunds(
    client, client_user, client_headers, psychologist, make_paid_booking,
    fake_payment, settings,
):
    now = datetime.now(timezone.utc)
    booking = await make_paid_booking(
        client_user, psychologist,
        selected_time=now + timedelta(hours=settings.BOOKING_FREE_CANCEL_HOURS),
    )

    with freeze_time(now):
        response = await client.post(cancel_url(booking), headers=client_headers)

    assert response.status_code == 200
    assert len(fake_payment.refund_calls) == 1


@pytest.mark.parametrize("who", ["psychologist", "admin"])
async def test_cancel_late_by_staff_always_refunds(
    client, client_user, psychologist, make_paid_booking, fake_payment,
    psychologist_headers, admin_headers, who,
):
    soon = datetime.now(timezone.utc) + timedelta(hours=1)
    booking = await make_paid_booking(client_user, psychologist, selected_time=soon)
    headers = psychologist_headers if who == "psychologist" else admin_headers

    response = await client.post(cancel_url(booking), headers=headers)

    assert response.status_code == 200
    assert response.json()["payment_status"] == "refunded"
    assert len(fake_payment.refund_calls) == 1


async def test_cancel_session_already_started(
    client, client_user, client_headers, psychologist, make_paid_booking
):
    started = datetime.now(timezone.utc) - timedelta(minutes=10)
    booking = await make_paid_booking(
        client_user, psychologist, selected_time=started
    )

    response = await client.post(cancel_url(booking), headers=client_headers)

    assert response.status_code == 409
    assert response.json()["code"] == "CANCEL_SESSION_STARTED"


async def test_cancel_payment_not_held(
    client, client_user, client_headers, psychologist, make_paid_booking
):
    booking = await make_paid_booking(
        client_user, psychologist, status=BookingStatus.COMPLETED,
        payment_status=PaymentStatus.PAID,
    )

    response = await client.post(cancel_url(booking), headers=client_headers)

    assert response.status_code == 409
    assert response.json()["code"] == "REFUND_NOT_AUTOMATIC"


async def test_cancel_without_payment_reference(
    client, client_user, client_headers, psychologist, make_paid_booking,
    fake_payment, slot,
):
    booking = await make_paid_booking(
        client_user, psychologist, selected_time=slot(3, 10),
        payment_reference=None,
    )

    response = await client.post(cancel_url(booking), headers=client_headers)

    assert response.status_code == 409
    assert response.json()["code"] == "REFUND_NOT_AUTOMATIC"
    assert fake_payment.refund_calls == []


async def test_cancel_refund_failed_marks_dispute(
    client, client_user, client_headers, psychologist, make_paid_booking,
    fake_payment, reload, slot,
):
    fake_payment.refund_error = PaymentProviderError("provider down")
    booking = await make_paid_booking(
        client_user, psychologist, selected_time=slot(3, 10)
    )

    response = await client.post(cancel_url(booking), headers=client_headers)

    assert response.status_code == 502
    assert response.json()["code"] == "REFUND_FAILED"
    await reload(booking)
    assert booking.status == BookingStatus.DISPUTED
    assert booking.refund_error is True
    assert booking.payment_status == PaymentStatus.HELD
    assert booking.dispute_note == "Refund failed"


async def test_cancel_foreign_booking(
    client, client_user, other_client, psychologist, make_booking, auth_headers
):
    booking = await make_booking(client_user, psychologist)

    response = await client.post(
        cancel_url(booking), headers=auth_headers(other_client)
    )

    assert response.status_code == 404
    assert response.json()["code"] == "BOOKING_NOT_FOUND"


async def test_cancel_unpaid_db_error(
    client, client_user, client_headers, psychologist, make_booking
):
    booking = await make_booking(client_user, psychologist)

    with patch.object(
        AsyncSession, "commit", new=AsyncMock(side_effect=SQLAlchemyError("x"))
    ):
        response = await client.post(cancel_url(booking), headers=client_headers)

    assert response.status_code == 500
    assert response.json()["code"] == "BOOKING_CANCEL_FAILED"


async def test_cancel_unauthorized(client):
    response = await client.post(f"{BOOKINGS}/{uuid.uuid4()}/cancel")

    assert response.status_code == 401


def dispute_url(booking):
    return f"{BOOKINGS}/{booking.id}/dispute"


@pytest.mark.parametrize("status", [BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
async def test_dispute_success(
    client, client_user, admin_user, admin_headers, psychologist,
    make_paid_booking, reload, status,
):
    booking = await make_paid_booking(client_user, psychologist, status=status)

    response = await client.post(
        dispute_url(booking), json={"note": "client complains"},
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "disputed"
    await reload(booking)
    assert booking.disputed_by_id == admin_user.id
    assert booking.dispute_note == "client complains"


@pytest.mark.parametrize(
    "status,payment",
    [
        (BookingStatus.PENDING, PaymentStatus.UNPAID),
        (BookingStatus.CANCELLED, PaymentStatus.UNPAID),
        (BookingStatus.COMPLETED, PaymentStatus.PAID),
    ],
)
async def test_dispute_wrong_state(
    client, client_user, admin_headers, psychologist, make_booking, status,
    payment,
):
    booking = await make_booking(
        client_user, psychologist, status=status, payment_status=payment
    )

    response = await client.post(
        dispute_url(booking), json={"note": "x"}, headers=admin_headers
    )

    assert response.status_code == 409
    assert response.json()["code"] == "BOOKING_WRONG_STATE"


async def test_dispute_not_found(client, admin_headers):
    response = await client.post(
        f"{BOOKINGS}/{uuid.uuid4()}/dispute", json={"note": "x"},
        headers=admin_headers,
    )

    assert response.status_code == 404
    assert response.json()["code"] == "BOOKING_NOT_FOUND"


async def test_dispute_forbidden_for_non_admin(
    client, client_user, client_headers, psychologist_headers, psychologist,
    make_paid_booking,
):
    booking = await make_paid_booking(client_user, psychologist)

    for headers in (client_headers, psychologist_headers):
        response = await client.post(
            dispute_url(booking), json={"note": "x"}, headers=headers
        )
        assert response.status_code == 403
        assert response.json()["code"] == "PERMISSION_DENIED"


@pytest.mark.parametrize("note", ["", "n" * 501])
async def test_dispute_note_validation(
    client, client_user, admin_headers, psychologist, make_paid_booking, note
):
    booking = await make_paid_booking(client_user, psychologist)

    response = await client.post(
        dispute_url(booking), json={"note": note}, headers=admin_headers
    )

    assert response.status_code == 422


def resolve_url(booking):
    return f"{BOOKINGS}/{booking.id}/resolve-dispute"


async def test_resolve_dispute_in_favour_of_psychologist(
    client, client_user, admin_user, admin_headers, psychologist,
    make_paid_booking, fake_payment, reload,
):
    booking = await make_paid_booking(
        client_user, psychologist, status=BookingStatus.DISPUTED,
        dispute_note="note",
    )

    response = await client.post(
        resolve_url(booking), json={"new_status": "completed"},
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    assert response.json()["payment_status"] == "held"
    await reload(booking)
    assert booking.dispute_resolved_by_id == admin_user.id
    assert fake_payment.refund_calls == []


async def test_resolve_dispute_in_favour_of_client_refunds(
    client, client_user, admin_headers, psychologist, make_paid_booking,
    fake_payment, reload,
):
    booking = await make_paid_booking(
        client_user, psychologist, status=BookingStatus.DISPUTED,
        dispute_note="note",
    )

    response = await client.post(
        resolve_url(booking), json={"new_status": "cancelled"},
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"
    assert response.json()["payment_status"] == "refunded"
    refund = fake_payment.refund_calls[0]
    assert refund.reason == "Dispute resolved in favour of the client"
    assert refund.amount == booking.price
    await reload(booking)
    assert booking.refund_error is False


async def test_resolve_dispute_not_disputed(
    client, client_user, admin_headers, psychologist, make_paid_booking
):
    booking = await make_paid_booking(client_user, psychologist)

    response = await client.post(
        resolve_url(booking), json={"new_status": "completed"},
        headers=admin_headers,
    )

    assert response.status_code == 409
    assert response.json()["code"] == "BOOKING_NOT_DISPUTED"


async def test_resolve_dispute_invalid_status(
    client, client_user, admin_headers, psychologist, make_paid_booking
):
    booking = await make_paid_booking(
        client_user, psychologist, status=BookingStatus.DISPUTED
    )

    response = await client.post(
        resolve_url(booking), json={"new_status": "confirmed"},
        headers=admin_headers,
    )

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


async def test_resolve_dispute_cancel_without_payment_reference(
    client, client_user, admin_headers, psychologist, make_paid_booking,
    fake_payment,
):
    booking = await make_paid_booking(
        client_user, psychologist, status=BookingStatus.DISPUTED,
        payment_reference=None,
    )

    response = await client.post(
        resolve_url(booking), json={"new_status": "cancelled"},
        headers=admin_headers,
    )

    assert response.status_code == 409
    assert response.json()["code"] == "REFUND_NOT_AUTOMATIC"
    assert fake_payment.refund_calls == []


async def test_resolve_dispute_cancel_when_payment_not_held(
    client, client_user, admin_headers, psychologist, make_paid_booking
):
    booking = await make_paid_booking(
        client_user, psychologist, status=BookingStatus.DISPUTED,
        payment_status=PaymentStatus.PAID,
    )

    response = await client.post(
        resolve_url(booking), json={"new_status": "cancelled"},
        headers=admin_headers,
    )

    assert response.status_code == 409
    assert response.json()["code"] == "REFUND_NOT_AUTOMATIC"


async def test_resolve_dispute_refund_failed(
    client, client_user, admin_headers, psychologist, make_paid_booking,
    fake_payment, reload,
):
    fake_payment.refund_error = PaymentProviderError("down")
    booking = await make_paid_booking(
        client_user, psychologist, status=BookingStatus.DISPUTED,
        dispute_note="too late",
    )

    response = await client.post(
        resolve_url(booking), json={"new_status": "cancelled"},
        headers=admin_headers,
    )

    assert response.status_code == 502
    assert response.json()["code"] == "REFUND_FAILED"
    await reload(booking)
    assert booking.status == BookingStatus.DISPUTED
    assert booking.refund_error is True
    assert booking.dispute_note == "Resolve dispute failed: too late"


async def test_resolve_dispute_not_found(client, admin_headers):
    response = await client.post(
        f"{BOOKINGS}/{uuid.uuid4()}/resolve-dispute",
        json={"new_status": "completed"}, headers=admin_headers,
    )

    assert response.status_code == 404


async def test_resolve_dispute_forbidden_for_client(
    client, client_user, client_headers, psychologist, make_paid_booking
):
    booking = await make_paid_booking(
        client_user, psychologist, status=BookingStatus.DISPUTED
    )

    response = await client.post(
        resolve_url(booking), json={"new_status": "completed"},
        headers=client_headers,
    )

    assert response.status_code == 403


def retry_url(booking):
    return f"{BOOKINGS}/{booking.id}/retry-info"


async def test_retry_info_success(
    client, client_user, client_headers, psychologist, make_booking
):
    booking = await make_booking(client_user, psychologist)

    response = await client.get(retry_url(booking), headers=client_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["booking_id"] == str(booking.id)
    assert body["status"] == "pending"
    assert body["payment_status"] == "unpaid"
    assert body["currency"] == "UAH"
    assert body["psychologist"]["psychologist_id"] == str(psychologist.psychologist_id)
    assert body["psychologist"]["full_name"] == "Тест Психолог"
    assert body["psychologist"]["is_verified"] is True


async def test_retry_info_works_for_cancelled_booking(
    client, client_user, client_headers, psychologist, make_booking
):
    booking = await make_booking(
        client_user, psychologist, status=BookingStatus.CANCELLED
    )

    response = await client.get(retry_url(booking), headers=client_headers)

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"


async def test_retry_info_lang_en(
    client, client_user, client_headers, psychologist, make_booking
):
    booking = await make_booking(client_user, psychologist)

    response = await client.get(
        retry_url(booking), params={"lang": "en"}, headers=client_headers
    )

    assert response.json()["psychologist"]["full_name"] == "Test Psychologist"
    assert response.json()["psychologist"]["title"] == "Clinical psychologist"


async def test_retry_info_foreign_booking(
    client, client_user, other_client, psychologist, make_booking, auth_headers
):
    booking = await make_booking(client_user, psychologist)

    response = await client.get(
        retry_url(booking), headers=auth_headers(other_client)
    )

    assert response.status_code == 403
    assert response.json()["code"] == "BOOKING_ACCESS_DENIED"


async def test_retry_info_not_found(client, client_headers):
    response = await client.get(
        f"{BOOKINGS}/{uuid.uuid4()}/retry-info", headers=client_headers
    )

    assert response.status_code == 404
    assert response.json()["code"] == "BOOKING_NOT_FOUND"


async def test_retry_info_unauthorized(client):
    response = await client.get(f"{BOOKINGS}/{uuid.uuid4()}/retry-info")

    assert response.status_code == 401
