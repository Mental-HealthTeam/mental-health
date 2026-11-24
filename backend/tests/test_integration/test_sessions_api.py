import uuid
from datetime import datetime, timedelta, timezone

import pytest

from database.models.models import BookingStatus, PaymentStatus

USER_SESSIONS = "/api/user/sessions"
USER_SCHEDULED_SESSIONS = "/api/user/sessions/scheduled"
USER_COMPLETED_SESSIONS = "/api/user/sessions/completed"
USER_SAVED_SESSIONS = "/api/user/sessions/saved"
PSYCHOLOGIST_SESSIONS = "/api/psychologist/sessions"

USER_SESSION_LISTS = [
    USER_SESSIONS,
    USER_SCHEDULED_SESSIONS,
    USER_COMPLETED_SESSIONS,
    USER_SAVED_SESSIONS,
]


def minutes_from_now(minutes: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)


def save_url(booking_id) -> str:
    return f"{USER_SESSIONS}/{booking_id}/save"


async def test_user_sessions_only_session_statuses(
    client, client_user, client_headers, psychologist, make_booking, slot
):
    statuses = [
        BookingStatus.PENDING,
        BookingStatus.CONFIRMED,
        BookingStatus.COMPLETED,
        BookingStatus.DISPUTED,
        BookingStatus.CANCELLED,
    ]
    for index, status in enumerate(statuses):
        await make_booking(
            client_user, psychologist, status=status,
            selected_time=slot(2 + index, 10),
            payment_status=PaymentStatus.HELD,
        )

    response = await client.get(USER_SESSIONS, headers=client_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 3
    assert {item["status"] for item in body["items"]} == {
        "confirmed", "completed", "disputed"
    }


async def test_user_sessions_order_and_scope(
    client, client_user, other_client, client_headers, psychologist,
    make_paid_booking, slot,
):
    late = await make_paid_booking(client_user, psychologist, selected_time=slot(5, 10))
    early = await make_paid_booking(client_user, psychologist, selected_time=slot(2, 10))
    await make_paid_booking(other_client, psychologist, selected_time=slot(3, 10))

    response = await client.get(USER_SESSIONS, headers=client_headers)

    ids = [item["booking_id"] for item in response.json()["items"]]
    assert ids == [str(early.id), str(late.id)]


async def test_user_sessions_meet_link_depends_on_payment(
    client, client_user, client_headers, psychologist, make_booking, slot
):
    cases = [
        (BookingStatus.CONFIRMED, PaymentStatus.HELD, True),
        (BookingStatus.COMPLETED, PaymentStatus.PAID, True),
        (BookingStatus.DISPUTED, PaymentStatus.HELD, True),
        (BookingStatus.CONFIRMED, PaymentStatus.UNPAID, False),
    ]
    for index, (status, payment, _) in enumerate(cases):
        await make_booking(
            client_user, psychologist, status=status, payment_status=payment,
            selected_time=slot(2 + index, 10),
        )

    response = await client.get(USER_SESSIONS, headers=client_headers)

    links = [item["meet_link"] for item in response.json()["items"]]
    expected = [psychologist.meet_link] * 3 + [None]
    assert links == expected


async def test_user_sessions_psychologist_block(
    client, client_user, client_headers, psychologist, make_paid_booking
):
    booking = await make_paid_booking(client_user, psychologist)

    response = await client.get(
        USER_SESSIONS, params={"lang": "en"}, headers=client_headers
    )

    item = response.json()["items"][0]
    assert item["booking_id"] == str(booking.id)
    assert item["price"] == "1000.00"
    assert item["currency"] == "UAH"
    assert item["payment_status"] == "held"
    assert item["psychologist"]["full_name"] == "Test Psychologist"
    assert sorted(item["psychologist"]["specializations"]) == ["anxiety", "stress"]
    assert item["client"] is None


async def test_user_sessions_empty(client, client_headers):
    response = await client.get(USER_SESSIONS, headers=client_headers)

    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0}


async def test_user_sessions_forbidden_for_other_roles(
    client, psychologist_headers, admin_headers
):
    for headers in (psychologist_headers, admin_headers):
        response = await client.get(USER_SESSIONS, headers=headers)
        assert response.status_code == 403
        assert response.json()["code"] == "PERMISSION_DENIED"


async def test_user_sessions_unauthorized(client):
    response = await client.get(USER_SESSIONS)

    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"


async def test_psychologist_sessions_with_client(
    client, client_user, other_client, psychologist, psychologist_headers,
    make_psychologist, make_paid_booking, slot,
):
    stranger = await make_psychologist()
    mine = await make_paid_booking(client_user, psychologist, selected_time=slot(2, 10))
    await make_paid_booking(other_client, stranger, selected_time=slot(3, 10))

    response = await client.get(PSYCHOLOGIST_SESSIONS, headers=psychologist_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    item = body["items"][0]
    assert item["booking_id"] == str(mine.id)
    assert item["client"]["id"] == str(client_user.id)
    assert item["client"]["name"] == client_user.name
    assert item["meet_link"] == psychologist.meet_link


async def test_psychologist_sessions_hide_unpaid_and_cancelled(
    client, client_user, psychologist, psychologist_headers, make_booking, slot
):
    await make_booking(client_user, psychologist, selected_time=slot(2, 10))
    await make_booking(
        client_user, psychologist, status=BookingStatus.CANCELLED,
        selected_time=slot(3, 10),
    )

    response = await client.get(PSYCHOLOGIST_SESSIONS, headers=psychologist_headers)

    assert response.json()["total"] == 0


async def test_psychologist_sessions_forbidden_for_client(client, client_headers):
    response = await client.get(PSYCHOLOGIST_SESSIONS, headers=client_headers)

    assert response.status_code == 403
    assert response.json()["code"] == "PERMISSION_DENIED"


async def test_psychologist_sessions_unauthorized(client):
    response = await client.get(PSYCHOLOGIST_SESSIONS)

    assert response.status_code == 401


async def test_user_sessions_active_first_then_completed(
    client, client_user, client_headers, psychologist, make_paid_booking, slot
):
    in_progress = await make_paid_booking(
        client_user, psychologist, selected_time=minutes_from_now(-20)
    )
    soon = await make_paid_booking(
        client_user, psychologist, selected_time=minutes_from_now(30)
    )
    later = await make_paid_booking(
        client_user, psychologist, selected_time=slot(3, 10)
    )
    done_recent = await make_paid_booking(
        client_user, psychologist, selected_time=minutes_from_now(-180)
    )
    done_old = await make_paid_booking(
        client_user, psychologist, selected_time=slot(-2, 10)
    )

    response = await client.get(USER_SESSIONS, headers=client_headers)

    ids = [item["booking_id"] for item in response.json()["items"]]
    assert ids == [
        str(in_progress.id),
        str(soon.id),
        str(later.id),
        str(done_recent.id),
        str(done_old.id),
    ]


async def test_user_sessions_include_saved_flag(
    client, client_user, client_headers, psychologist, make_paid_booking, slot
):
    await make_paid_booking(
        client_user, psychologist, selected_time=slot(2, 10), saved=True
    )
    await make_paid_booking(
        client_user, psychologist, selected_time=slot(3, 10)
    )

    response = await client.get(USER_SESSIONS, headers=client_headers)

    assert [item["saved"] for item in response.json()["items"]] == [True, False]


async def test_user_scheduled_sessions_order_and_scope(
    client, client_user, other_client, client_headers, psychologist,
    make_booking, make_paid_booking, slot,
):
    in_progress = await make_paid_booking(
        client_user, psychologist, selected_time=minutes_from_now(-20)
    )
    soon = await make_paid_booking(
        client_user, psychologist, selected_time=minutes_from_now(30)
    )
    later = await make_paid_booking(
        client_user, psychologist, selected_time=slot(3, 10)
    )
    await make_paid_booking(
        client_user, psychologist, selected_time=minutes_from_now(-180)
    )
    await make_paid_booking(
        other_client, psychologist, selected_time=slot(4, 10)
    )
    await make_booking(client_user, psychologist, selected_time=slot(5, 10))

    response = await client.get(USER_SCHEDULED_SESSIONS, headers=client_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 3
    assert [item["booking_id"] for item in body["items"]] == [
        str(in_progress.id), str(soon.id), str(later.id)
    ]
    assert all(item["client"] is None for item in body["items"])


async def test_user_sessions_split_at_session_duration(
    client, client_user, client_headers, psychologist, make_paid_booking
):
    still_running = await make_paid_booking(
        client_user, psychologist, selected_time=minutes_from_now(-45)
    )
    just_finished = await make_paid_booking(
        client_user, psychologist, selected_time=minutes_from_now(-55)
    )

    scheduled = await client.get(USER_SCHEDULED_SESSIONS, headers=client_headers)
    completed = await client.get(USER_COMPLETED_SESSIONS, headers=client_headers)

    assert [i["booking_id"] for i in scheduled.json()["items"]] == [
        str(still_running.id)
    ]
    assert [i["booking_id"] for i in completed.json()["items"]] == [
        str(just_finished.id)
    ]


async def test_user_completed_sessions_order_and_scope(
    client, client_user, other_client, client_headers, psychologist,
    make_booking, make_paid_booking, slot,
):
    newest = await make_paid_booking(
        client_user, psychologist, selected_time=minutes_from_now(-180)
    )
    middle = await make_paid_booking(
        client_user, psychologist, selected_time=slot(-1, 10),
        status=BookingStatus.COMPLETED,
    )
    oldest = await make_paid_booking(
        client_user, psychologist, selected_time=slot(-3, 10)
    )
    await make_paid_booking(
        client_user, psychologist, selected_time=minutes_from_now(-20)
    )
    await make_paid_booking(
        client_user, psychologist, selected_time=slot(2, 10)
    )
    await make_paid_booking(
        other_client, psychologist, selected_time=slot(-4, 10)
    )
    await make_booking(
        client_user, psychologist, selected_time=slot(-5, 10),
        status=BookingStatus.CANCELLED,
    )

    response = await client.get(USER_COMPLETED_SESSIONS, headers=client_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 3
    assert [item["booking_id"] for item in body["items"]] == [
        str(newest.id), str(middle.id), str(oldest.id)
    ]


async def test_user_saved_sessions_only_saved_and_ordered(
    client, client_user, other_client, client_headers, psychologist,
    make_paid_booking, slot,
):
    saved_future = await make_paid_booking(
        client_user, psychologist, selected_time=slot(2, 10), saved=True
    )
    saved_past = await make_paid_booking(
        client_user, psychologist, selected_time=slot(-2, 10), saved=True
    )
    await make_paid_booking(client_user, psychologist, selected_time=slot(3, 10))
    await make_paid_booking(
        other_client, psychologist, selected_time=slot(4, 10), saved=True
    )

    response = await client.get(USER_SAVED_SESSIONS, headers=client_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert [item["booking_id"] for item in body["items"]] == [
        str(saved_future.id), str(saved_past.id)
    ]
    assert all(item["saved"] is True for item in body["items"])


@pytest.mark.parametrize("path", USER_SESSION_LISTS)
async def test_user_session_lists_empty(client, client_headers, path):
    response = await client.get(path, headers=client_headers)

    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0}


@pytest.mark.parametrize("path", USER_SESSION_LISTS)
async def test_user_session_lists_forbidden_for_other_roles(
    client, psychologist_headers, admin_headers, path
):
    for headers in (psychologist_headers, admin_headers):
        response = await client.get(path, headers=headers)
        assert response.status_code == 403
        assert response.json()["code"] == "PERMISSION_DENIED"


@pytest.mark.parametrize("path", USER_SESSION_LISTS)
async def test_user_session_lists_unauthorized(client, path):
    response = await client.get(path)

    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"


async def test_save_user_session(
    client, client_user, client_headers, psychologist, make_paid_booking
):
    booking = await make_paid_booking(client_user, psychologist)

    response = await client.post(save_url(booking.id), headers=client_headers)

    assert response.status_code == 200
    assert response.json() == {"booking_id": str(booking.id), "saved": True}
    saved = await client.get(USER_SAVED_SESSIONS, headers=client_headers)
    assert [i["booking_id"] for i in saved.json()["items"]] == [str(booking.id)]


async def test_save_user_session_is_idempotent(
    client, client_user, client_headers, psychologist, make_paid_booking
):
    booking = await make_paid_booking(client_user, psychologist)

    first = await client.post(save_url(booking.id), headers=client_headers)
    second = await client.post(save_url(booking.id), headers=client_headers)

    assert first.status_code == second.status_code == 200
    assert second.json()["saved"] is True


async def test_unsave_user_session(
    client, client_user, client_headers, psychologist, make_paid_booking
):
    booking = await make_paid_booking(client_user, psychologist, saved=True)

    response = await client.delete(save_url(booking.id), headers=client_headers)

    assert response.status_code == 200
    assert response.json() == {"booking_id": str(booking.id), "saved": False}
    saved = await client.get(USER_SAVED_SESSIONS, headers=client_headers)
    assert saved.json()["total"] == 0


async def test_unsave_user_session_is_idempotent(
    client, client_user, client_headers, psychologist, make_paid_booking
):
    booking = await make_paid_booking(client_user, psychologist)

    response = await client.delete(save_url(booking.id), headers=client_headers)

    assert response.status_code == 200
    assert response.json()["saved"] is False


@pytest.mark.parametrize("method", ["post", "delete"])
async def test_save_unknown_booking_returns_404(client, client_headers, method):
    response = await getattr(client, method)(
        save_url(uuid.uuid4()), headers=client_headers
    )

    assert response.status_code == 404
    assert response.json()["code"] == "BOOKING_NOT_FOUND"


@pytest.mark.parametrize("method", ["post", "delete"])
async def test_save_other_clients_booking_returns_404(
    client, other_client, client_headers, psychologist, make_paid_booking, method
):
    booking = await make_paid_booking(other_client, psychologist)

    response = await getattr(client, method)(
        save_url(booking.id), headers=client_headers
    )

    assert response.status_code == 404
    assert response.json()["code"] == "BOOKING_NOT_FOUND"


@pytest.mark.parametrize(
    "status",
    [BookingStatus.PENDING, BookingStatus.CANCELLED],
)
@pytest.mark.parametrize("method", ["post", "delete"])
async def test_save_non_session_booking_returns_404(
    client, client_user, client_headers, psychologist, make_booking, status, method
):
    booking = await make_booking(client_user, psychologist, status=status)

    response = await getattr(client, method)(
        save_url(booking.id), headers=client_headers
    )

    assert response.status_code == 404
    assert response.json()["code"] == "BOOKING_NOT_FOUND"


@pytest.mark.parametrize("method", ["post", "delete"])
async def test_save_forbidden_for_other_roles(
    client, psychologist_headers, admin_headers, method
):
    for headers in (psychologist_headers, admin_headers):
        response = await getattr(client, method)(
            save_url(uuid.uuid4()), headers=headers
        )
        assert response.status_code == 403
        assert response.json()["code"] == "PERMISSION_DENIED"


@pytest.mark.parametrize("method", ["post", "delete"])
async def test_save_unauthorized(client, method):
    response = await getattr(client, method)(save_url(uuid.uuid4()))

    assert response.status_code == 401
