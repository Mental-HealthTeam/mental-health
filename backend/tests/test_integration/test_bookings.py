import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

import app.auth.dependencies as auth_dependencies
from app.main import app
from auth.dependencies import get_current_user
from config.dependencies import get_settings
from database import get_db
from database.models.models import (
    Booking,
    BookingStatus,
    Gender,
    Language,
    PaymentStatus,
    Psychologist,
    PsychologistSpecialization,
    PsychologistStatus,
    SelectionSource,
    SymptomCode,
    User,
    UserRole,
)
from exceptions.base import AppError
from routes import bookings as booking_routes
from routes import sessions as session_routes
from services.booking_localization import build_booking_response
from services.session_service import set_meet_link


@pytest.fixture
def bookings_client():
    previous_overrides = app.dependency_overrides.copy()

    app.dependency_overrides[get_db] = lambda: object()
    app.dependency_overrides[get_settings] = lambda: SimpleNamespace(
        ACCESS_COOKIE="access_token",
        SECRET_KEY_ACCESS="test-secret-key",
    )
    app.dependency_overrides[
        auth_dependencies.get_jwt_manager
    ] = lambda: object()

    try:
        with TestClient(app) as client:
            yield client
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)


@pytest.fixture
def client_user():
    return User(
        id=uuid.uuid4(),
        email="client@example.com",
        name="Test Client",
        avatar_url=None,
        role=UserRole.CLIENT,
    )


@pytest.fixture
def psychologist():
    psychologist_user = User(
        id=uuid.uuid4(),
        email="psychologist@example.com",
        name="Test Psychologist",
        avatar_url="https://example.com/avatar.png",
        role=UserRole.PSYCHOLOGIST,
    )

    psychologist = Psychologist(
        psychologist_id=psychologist_user.id,
        full_name="Тестовий психолог",
        full_name_eng="Test Psychologist",
        title="Клінічний психолог",
        title_eng="Clinical Psychologist",
        experience_years=5,
        price_per_hour=Decimal("500.00"),
        profile_status=PsychologistStatus.ACTIVE,
        gender=Gender.MALE,
        languages=["uk", "en"],
        iban="UA1234567890123456789012345",
        tax_id="1234567890",
        account_name="Test Psychologist",
    )

    psychologist.user = psychologist_user
    psychologist.psychologist_specializations = [
        PsychologistSpecialization(
            symptom_code=SymptomCode.ANXIETY,
        ),
        PsychologistSpecialization(
            symptom_code=SymptomCode.STRESS,
        ),
    ]

    return psychologist


@pytest.fixture
def booking_response(client_user, psychologist):
    booking = Booking(
        id=uuid.uuid4(),
        client_id=client_user.id,
        psychologist_id=psychologist.psychologist_id,
        psychologist=psychologist,
        client=client_user,
        selected_time=datetime.now(timezone.utc) + timedelta(days=2),
        status=BookingStatus.PENDING,
        payment_status=PaymentStatus.UNPAID,
        price=Decimal("500.00"),
        currency="UAH",
        selection_source=SelectionSource.MANUAL_FILTER,
        ai_session_id=None,
        hold_expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
    )
    booking.meet_link = "https://example.com/meeting"
    return booking


def test_create_booking_returns_201(
    bookings_client, client_user, booking_response, monkeypatch
):
    app.dependency_overrides[get_current_user] = lambda: client_user

    create_mock = AsyncMock(return_value=booking_response)
    monkeypatch.setattr(booking_routes, "create_booking", create_mock)

    psychologist_id = booking_response.psychologist.psychologist_id
    selected_time = datetime.now(timezone.utc) + timedelta(days=2)

    response = bookings_client.post(
        "/api/bookings",
        json={
            "psychologist_id": str(psychologist_id),
            "selected_time": selected_time.isoformat(),
        },
    )

    assert response.status_code == 201

    body = response.json()

    assert body["booking_id"] == str(booking_response.id)
    assert body["status"] == BookingStatus.PENDING.value
    assert body["payment_status"] == PaymentStatus.UNPAID.value
    assert body["psychologist"]["psychologist_id"] == str(psychologist_id)
    assert body["psychologist"]["experience_years"] == 5
    assert body["psychologist"]["is_verified"] is True

    create_mock.assert_awaited_once()

    kwargs = create_mock.await_args.kwargs

    assert kwargs["client"] is client_user
    assert kwargs["data"].psychologist_id == psychologist_id


def test_create_booking_without_authentication_returns_401(
    bookings_client, monkeypatch
):
    create_mock = AsyncMock()
    monkeypatch.setattr(booking_routes, "create_booking", create_mock)

    response = bookings_client.post(
        "/api/bookings",
        json={
            "psychologist_id": str(uuid.uuid4()),
            "selected_time": datetime.now(timezone.utc).isoformat(),
        },
    )

    assert response.status_code == 401
    create_mock.assert_not_awaited()


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {
            "psychologist_id": "not-a-uuid",
            "selected_time": datetime.now(timezone.utc).isoformat(),
        },
        {
            "psychologist_id": str(uuid.uuid4()),
            "selected_time": datetime.now().isoformat(),
        },
        {
            "psychologist_id": str(uuid.uuid4()),
            "selected_time": datetime.now(timezone.utc).isoformat(),
            "unexpected_field": "not allowed",
        },
    ],
)
def test_create_booking_rejects_invalid_payload(
    bookings_client, client_user, payload, monkeypatch
):
    app.dependency_overrides[get_current_user] = lambda: client_user

    create_mock = AsyncMock()
    monkeypatch.setattr(booking_routes, "create_booking", create_mock)

    response = bookings_client.post("/api/bookings", json=payload)

    assert response.status_code == 422
    create_mock.assert_not_awaited()


def test_list_bookings_returns_200(
    bookings_client, client_user, booking_response, monkeypatch
):
    app.dependency_overrides[get_current_user] = lambda: client_user

    list_mock = AsyncMock(
        return_value=([booking_response], 1)
    )
    monkeypatch.setattr(
        booking_routes,
        "list_bookings_for_user",
        list_mock,
    )

    response = bookings_client.get("/api/bookings")

    assert response.status_code == 200

    body = response.json()

    assert body["total"] == 1
    assert len(body["items"]) == 1
    assert body["items"][0]["booking_id"] == str(booking_response.id)

    list_mock.assert_awaited_once()


def test_get_booking_returns_200(
    bookings_client, client_user, booking_response, monkeypatch
):
    app.dependency_overrides[get_current_user] = lambda: client_user

    booking_mock = AsyncMock(return_value=booking_response)

    monkeypatch.setattr(
        booking_routes,
        "get_booking_for_user",
        booking_mock,
    )

    booking_id = booking_response.id

    response = bookings_client.get(f"/api/bookings/{booking_id}")

    assert response.status_code == 200

    body = response.json()

    assert body["booking_id"] == str(booking_id)
    assert body["status"] == BookingStatus.PENDING.value

    booking_mock.assert_awaited_once()


def test_get_booking_not_found_returns_404(
    bookings_client, client_user, monkeypatch
):
    app.dependency_overrides[get_current_user] = lambda: client_user

    booking_mock = AsyncMock(
        side_effect=AppError(
            status_code=404,
            code="BOOKING_NOT_FOUND",
            detail="Booking not found.",
        )
    )

    monkeypatch.setattr(
        booking_routes,
        "get_booking_for_user",
        booking_mock,
    )

    booking_id = uuid.uuid4()

    response = bookings_client.get(f"/api/bookings/{booking_id}")

    assert response.status_code == 404

    assert response.json() == {
        "code": "BOOKING_NOT_FOUND",
        "detail": "Booking not found.",
    }

    booking_mock.assert_awaited_once()


def test_list_bookings_passes_filters_and_pagination(
    bookings_client, client_user, monkeypatch
):
    app.dependency_overrides[get_current_user] = lambda: client_user

    list_mock = AsyncMock(return_value=([], 0))

    monkeypatch.setattr(
        booking_routes,
        "list_bookings_for_user",
        list_mock,
    )

    response = bookings_client.get(
        "/api/bookings",
        params={
            "status": "pending",
            "limit": 5,
            "offset": 10,
        },
    )

    assert response.status_code == 200

    call_kwargs = list_mock.await_args.kwargs

    assert call_kwargs["user"] is client_user
    assert call_kwargs["booking_status"] == BookingStatus.PENDING
    assert call_kwargs["limit"] == 5
    assert call_kwargs["offset"] == 10


@pytest.mark.parametrize(
    ("language", "expected_name", "expected_title"),
    [
        (
            Language.UKRAINIAN,
            "Тестовий психолог",
            "Клінічний психолог",
        ),
        (
            Language.ENGLISH,
            "Test Psychologist",
            "Clinical Psychologist",
        ),
    ],
)
def test_booking_localization(
    client_user,
    psychologist,
    booking_response,
    language,
    expected_name,
    expected_title,
):
    response = build_booking_response(booking_response, language)

    assert response.psychologist.full_name == expected_name
    assert response.psychologist.title == expected_title
    assert response.psychologist.specializations == [
        "anxiety",
        "stress",
    ]


@pytest.mark.parametrize(
    ("language", "expected_name", "expected_title"),
    [
        (
            Language.UKRAINIAN,
            "Тестовий психолог",
            "Клінічний психолог",
        ),
        (
            Language.ENGLISH,
            "Test Psychologist",
            "Clinical Psychologist",
        ),
    ],
)
def test_user_sessions_localization(
    bookings_client,
    client_user,
    booking_response,
    language,
    expected_name,
    expected_title,
    monkeypatch,
):
    app.dependency_overrides[get_current_user] = lambda: client_user

    sessions_mock = AsyncMock(return_value=[booking_response])
    monkeypatch.setattr(
        session_routes,
        "get_sessions_for_user",
        sessions_mock,
    )

    response = bookings_client.get(
        "/api/user/sessions",
        params={"lang": language.value},
    )

    assert response.status_code == 200

    psychologist_data = response.json()["items"][0]["psychologist"]

    assert psychologist_data["full_name"] == expected_name
    assert psychologist_data["title"] == expected_title
    assert psychologist_data["specializations"] == [
        "anxiety",
        "stress",
    ]


@pytest.mark.parametrize(
    ("language", "expected_name", "expected_title"),
    [
        (
            Language.UKRAINIAN,
            "Тестовий психолог",
            "Клінічний психолог",
        ),
        (
            Language.ENGLISH,
            "Test Psychologist",
            "Clinical Psychologist",
        ),
    ],
)
def test_psychologist_sessions_localization(
    bookings_client,
    psychologist,
    booking_response,
    language,
    expected_name,
    expected_title,
    monkeypatch,
):
    app.dependency_overrides[get_current_user] = (
        lambda: psychologist.user
    )

    sessions_mock = AsyncMock(return_value=[booking_response])
    monkeypatch.setattr(
        session_routes,
        "get_sessions_for_psychologist",
        sessions_mock,
    )

    response = bookings_client.get(
        "/api/psychologist/sessions",
        params={"lang": language.value},
    )

    assert response.status_code == 200

    psychologist_data = response.json()["items"][0]["psychologist"]

    assert psychologist_data["full_name"] == expected_name
    assert psychologist_data["title"] == expected_title
    assert psychologist_data["specializations"] == [
        "anxiety",
        "stress",
    ]


@pytest.mark.parametrize(
    ("status", "payment_status"),
    [
        (BookingStatus.CONFIRMED, PaymentStatus.PAID),
        (BookingStatus.CONFIRMED, PaymentStatus.HELD),
        (BookingStatus.COMPLETED, PaymentStatus.PAID),
        (BookingStatus.DISPUTED, PaymentStatus.PAID),
    ],
)
def test_set_meet_link_for_paid_eligible_sessions(
    booking_response,
    psychologist,
    status,
    payment_status,
):
    psychologist.meet_link = "https://example.com/meeting"
    booking_response.status = status
    booking_response.payment_status = payment_status

    set_meet_link(booking_response)

    assert booking_response.meet_link == "https://example.com/meeting"


@pytest.mark.parametrize(
    ("status", "payment_status"),
    [
        (BookingStatus.PENDING, PaymentStatus.PAID),
        (BookingStatus.CONFIRMED, PaymentStatus.UNPAID),
        (BookingStatus.PENDING, PaymentStatus.UNPAID),
    ],
)
def test_set_meet_link_for_ineligible_sessions(
    booking_response,
    psychologist,
    status,
    payment_status,
):
    psychologist.meet_link = "https://example.com/meeting"
    booking_response.status = status
    booking_response.payment_status = payment_status

    set_meet_link(booking_response)

    assert booking_response.meet_link is None
