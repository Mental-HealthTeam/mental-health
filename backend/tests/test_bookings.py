import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock
from fastapi import HTTPException

import pytest
from fastapi.testclient import TestClient

from app.main import app
from auth.dependencies import get_current_user
import auth.dependencies as auth_dependencies
from config.dependencies import get_settings
from database import get_db
from database.models.models import (
    BookingStatus,
    PaymentStatus,
    SelectionSource,
    User,
    UserRole,
)
from routes import bookings as booking_routes



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
def booking_response(client_user):
    psychologist_id = uuid.uuid4()

    return {
        "id": uuid.uuid4(),
        "psychologist": {
            "psychologist_id": psychologist_id,
            "full_name": "Test Psychologist",
            "title": "Clinical Psychologist",
            "avatar_url": None,
        },
        "selected_time": datetime.now(timezone.utc) + timedelta(days=2),
        "selected_time_label": "Test appointment",
        "status": BookingStatus.PENDING,
        "payment_status": PaymentStatus.UNPAID,
        "price": Decimal("500.00"),
        "currency": "UAH",
        "selection_source": SelectionSource.MANUAL_FILTER,
        "ai_session_id": None,
        "hold_expires_at": datetime.now(timezone.utc) + timedelta(minutes=15),
        "meet_link": None,
    }


def test_create_booking_returns_201(
    bookings_client, client_user, booking_response, monkeypatch
):
    app.dependency_overrides[get_current_user] = lambda: client_user

    create_mock = AsyncMock(return_value=booking_response)
    monkeypatch.setattr(booking_routes, "create_booking", create_mock)

    psychologist_id = booking_response["psychologist"]["psychologist_id"]
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

    assert body["booking_id"] == str(booking_response["id"])
    assert body["status"] == BookingStatus.PENDING.value
    assert body["payment_status"] == PaymentStatus.UNPAID.value
    assert body["psychologist"]["psychologist_id"] == str(psychologist_id)

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
    monkeypatch.setattr(booking_routes, "list_bookings_for_user", list_mock)

    response = bookings_client.get("/api/bookings")

    assert response.status_code == 200
    body = response.json()

    assert body["total"] == 1
    assert len(body["items"]) == 1
    assert body["items"][0]["booking_id"] == str(booking_response["id"])

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

    booking_id = booking_response["id"]
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
        side_effect=HTTPException(
            status_code=404,
            detail="Booking not found",
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
    assert response.json()["detail"] == "Booking not found"

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