from unittest.mock import patch

from httpx import ASGITransport, AsyncClient

from main import app


async def test_app_error_body_shape(client):
    response = await client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.json() == {
        "code": "NOT_AUTHENTICATED",
        "detail": "Not authenticated",
    }


async def test_validation_error_body_shape(client):
    body = {"matching_info": {
        "session_id": "s", "symptom_codes": ["nope"], "language": ["uk"],
    }}

    response = await client.post("/api/matching/search", json=body)

    assert response.status_code == 422
    result = response.json()
    assert result["code"] == "VALIDATION_ERROR"
    assert result["detail"] == "Invalid request data."
    assert result["errors"][0]["field"] == "matching_info.symptom_codes.0"
    assert result["errors"][0]["reason"] in {
        "required", "too_short", "too_long", "invalid_format", "invalid_value",
    }


async def test_unknown_url_has_not_found_code(client):
    response = await client.get("/api/does-not-exist")

    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


async def test_wrong_method_has_method_not_allowed_code(client):
    response = await client.delete("/api/symptom-codes")

    assert response.status_code == 405
    assert response.json()["code"] == "METHOD_NOT_ALLOWED"


async def test_unhandled_exception_returns_internal_error(client):
    transport = ASGITransport(app=app, raise_app_exceptions=False)

    with patch("routes.symptom_codes.SymptomCode", new=None):
        async with AsyncClient(transport=transport, base_url="http://test") as quiet:
            response = await quiet.get("/api/symptom-codes")

    assert response.status_code == 500
    assert response.json()["code"] == "INTERNAL_ERROR"
    assert "Traceback" not in response.text


async def test_health(client):
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
