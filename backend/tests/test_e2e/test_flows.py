import uuid
from datetime import datetime, timedelta, timezone

from database.models.models import (
    Booking,
    BookingStatus,
    PaymentStatus,
)
from services.booking_service import (
    complete_session_with_psychologist,
    expire_pending_bookings,
)
from services.payment_service import payout_service


async def start_booking(client, headers, psychologist, when):
    response = await client.post(
        "/api/bookings",
        json={
            "psychologist_id": str(psychologist.psychologist_id),
            "selected_time": when.isoformat(),
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()["booking_id"]


async def pay(client, headers, db_session, fake_payment, make_webhook, booking_id):
    checkout = await client.post(
        "/api/payments/checkout", json={"booking_id": booking_id}, headers=headers
    )
    assert checkout.status_code == 200, checkout.text
    booking = await db_session.get(Booking, uuid.UUID(booking_id))
    await db_session.refresh(booking)
    fake_payment.next_webhook = make_webhook(booking, "Approved")
    webhook = await client.post("/api/payments/webhook/wayforpay", json={})
    assert webhook.status_code == 200
    await db_session.refresh(booking)
    return booking


async def test_from_matching_to_payout(
    client, client_headers, psychologist, fake_payment, make_webhook,
    db_session, settings, slot,
):
    found = await client.post(
        "/api/matching/search",
        json={"matching_info": {
            "session_id": "chat-1", "symptom_codes": ["anxiety"], "language": ["uk"],
        }},
        headers=client_headers,
    )
    assert [r["psychologist_id"] for r in found.json()["result"]] == [
        str(psychologist.psychologist_id)
    ]
    chosen = found.json()["result"][0]["mock_slots"][0]["time"]
    when = datetime.fromisoformat(chosen.replace("Z", "+00:00"))
    booking_id = await start_booking(client, client_headers, psychologist, when)

    booking = await pay(
        client, client_headers, db_session, fake_payment, make_webhook, booking_id
    )

    assert booking.status == BookingStatus.CONFIRMED
    assert booking.payment_status == PaymentStatus.HELD
    sessions = await client.get("/api/user/sessions", headers=client_headers)
    assert sessions.json()["total"] == 1
    assert sessions.json()["items"][0]["meet_link"] == psychologist.meet_link

    now = datetime.now(timezone.utc)
    booking.selected_time = now - timedelta(minutes=settings.SESSION_DURATION_MIN + 5)
    await db_session.commit()
    completed = await complete_session_with_psychologist(
        db=db_session, now=now, session_time_min=settings.SESSION_DURATION_MIN
    )
    assert completed == 1

    await payout_service(
        db=db_session, payment_provider=fake_payment, settings=settings
    )

    await db_session.refresh(booking)
    assert booking.payment_status == PaymentStatus.PAID
    assert booking.payout_amount == booking.price - booking.platform_fee
    assert len(fake_payment.payout_calls) == 1


async def test_cancel_with_refund_then_slot_is_bookable_again(
    client, client_headers, other_client, psychologist, fake_payment,
    make_webhook, db_session, auth_headers, slot,
):
    when = slot(3, 12)
    booking_id = await start_booking(client, client_headers, psychologist, when)
    await pay(client, client_headers, db_session, fake_payment, make_webhook, booking_id)

    cancel = await client.post(
        f"/api/bookings/{booking_id}/cancel", headers=client_headers
    )

    assert cancel.json()["status"] == "cancelled"
    assert cancel.json()["payment_status"] == "refunded"
    assert len(fake_payment.refund_calls) == 1
    detail = await client.get(f"/api/psychologists/{psychologist.psychologist_id}")
    offered = [s["time"] for s in detail.json()["mock_slots"]]
    assert any(when.strftime("%Y-%m-%dT%H:00") in t for t in offered)
    again = await client.post(
        "/api/bookings",
        json={
            "psychologist_id": str(psychologist.psychologist_id),
            "selected_time": when.isoformat(),
        },
        headers=auth_headers(other_client),
    )
    assert again.status_code == 201


async def test_hold_expires_then_slot_is_rebooked(
    client, client_headers, other_client, psychologist, db_session, auth_headers,
    slot,
):
    when = slot(2, 10)
    booking_id = await start_booking(client, client_headers, psychologist, when)
    booking = await db_session.get(Booking, uuid.UUID(booking_id))
    booking.hold_expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    await db_session.commit()

    checkout = await client.post(
        "/api/payments/checkout", json={"booking_id": booking_id},
        headers=client_headers,
    )
    assert checkout.json()["code"] == "BOOKING_HOLD_EXPIRED"
    blocked = await client.post(
        "/api/bookings",
        json={
            "psychologist_id": str(psychologist.psychologist_id),
            "selected_time": when.isoformat(),
        },
        headers=auth_headers(other_client),
    )
    assert blocked.json()["code"] == "SLOT_ALREADY_BOOKED"

    expired = await expire_pending_bookings(db_session, datetime.now(timezone.utc))

    assert expired == 1
    rebooked = await client.post(
        "/api/bookings",
        json={
            "psychologist_id": str(psychologist.psychologist_id),
            "selected_time": when.isoformat(),
        },
        headers=auth_headers(other_client),
    )
    assert rebooked.status_code == 201


async def test_auth_lifecycle(client):
    login = await client.post("/api/auth/google", json={"credential": "t"})
    assert login.status_code == 200
    assert (await client.get("/api/auth/me")).status_code == 200
    old_refresh = client.cookies.get("refresh")

    assert (await client.post("/api/auth/refresh")).status_code == 204
    assert (await client.get("/api/auth/me")).status_code == 200

    assert (await client.post("/api/auth/logout")).status_code == 204
    assert (await client.get("/api/auth/me")).status_code == 401
    reuse = await client.post(
        "/api/auth/refresh", headers={"Cookie": f"refresh={old_refresh}"}
    )
    assert reuse.status_code == 401


async def test_dispute_resolved_for_client_is_not_paid_out(
    client, client_headers, admin_headers, psychologist, fake_payment,
    make_webhook, db_session, settings, slot,
):
    booking_id = await start_booking(
        client, client_headers, psychologist, slot(3, 12)
    )
    booking = await pay(
        client, client_headers, db_session, fake_payment, make_webhook, booking_id
    )

    dispute = await client.post(
        f"/api/bookings/{booking_id}/dispute", json={"note": "no show"},
        headers=admin_headers,
    )
    resolve = await client.post(
        f"/api/bookings/{booking_id}/resolve-dispute",
        json={"new_status": "cancelled"}, headers=admin_headers,
    )

    assert dispute.json()["status"] == "disputed"
    assert resolve.json()["payment_status"] == "refunded"
    await payout_service(
        db=db_session, payment_provider=fake_payment, settings=settings
    )
    assert fake_payment.payout_calls == []


async def test_late_cancel_by_client_goes_to_payout(
    client, client_headers, psychologist, fake_payment, make_webhook, db_session,
    settings,
):
    soon = datetime.now(timezone.utc) + timedelta(hours=3)
    soon = soon.replace(minute=0, second=0, microsecond=0)
    psychologist.mock_slots = [soon.isoformat()]
    await db_session.commit()
    booking_id = await start_booking(client, client_headers, psychologist, soon)
    booking = await pay(
        client, client_headers, db_session, fake_payment, make_webhook, booking_id
    )

    refused = await client.post(
        f"/api/bookings/{booking_id}/cancel", headers=client_headers
    )
    accepted = await client.post(
        f"/api/bookings/{booking_id}/cancel", json={"confirm_no_refund": True},
        headers=client_headers,
    )

    assert refused.status_code == 409
    assert accepted.json()["status"] == "completed"
    assert fake_payment.refund_calls == []
    await payout_service(
        db=db_session, payment_provider=fake_payment, settings=settings
    )
    await db_session.refresh(booking)
    assert booking.payment_status == PaymentStatus.PAID


async def test_booking_endpoint_returns_meet_link_right_after_payment(
    client, client_headers, psychologist, fake_payment, make_webhook,
    db_session, slot,
):
    booking_id = await start_booking(
        client, client_headers, psychologist, slot(2, 10)
    )
    before = await client.get(f"/api/bookings/{booking_id}", headers=client_headers)

    await pay(
        client, client_headers, db_session, fake_payment, make_webhook, booking_id
    )
    after = await client.get(f"/api/bookings/{booking_id}", headers=client_headers)

    assert before.json()["status"] == "pending"
    assert before.json()["meet_link"] is None
    assert after.json()["status"] == "confirmed"
    assert after.json()["payment_status"] == "held"
    assert after.json()["meet_link"] == psychologist.meet_link
