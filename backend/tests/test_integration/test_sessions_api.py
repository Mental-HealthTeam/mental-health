from database.models.models import BookingStatus, PaymentStatus

USER_SESSIONS = "/api/user/sessions"
PSYCHOLOGIST_SESSIONS = "/api/psychologist/sessions"


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
