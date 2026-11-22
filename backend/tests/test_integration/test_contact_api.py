import pytest

CONTACT = "/contact"


def payload(**overrides):
    body = {
        "name": "Ivan",
        "contact": "@my_user",
        "message": "Hello, I need help",
    }
    body.update(overrides)
    return body


async def test_contact_success(client, fake_email):
    response = await client.post(CONTACT, json=payload())

    assert response.status_code == 202
    assert response.json() == {"detail": "Contact request accepted."}
    assert fake_email.calls == [
        {
            "name": "Ivan",
            "contact": "my_user",
            "message": "Hello, I need help",
            "user_id": None,
        }
    ]


async def test_contact_with_user_id(client, fake_email, client_user):
    response = await client.post(
        CONTACT, json=payload(user_id=str(client_user.id))
    )

    assert response.status_code == 202
    assert fake_email.calls[0]["user_id"] == str(client_user.id)


@pytest.mark.parametrize("contact", ["my.name1@gmail.com", "my.name1@googlemail.com"])
async def test_contact_gmail_contact(client, fake_email, contact):
    response = await client.post(CONTACT, json=payload(contact=contact))

    assert response.status_code == 202
    assert fake_email.calls[0]["contact"] == contact


@pytest.mark.parametrize(
    "contact",
    ["a@yahoo.com", "ab", "@ab", "a..bcdef@gmail.com", ".abcdef@gmail.com"],
)
async def test_contact_invalid_contact(client, fake_email, contact):
    response = await client.post(CONTACT, json=payload(contact=contact))

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"
    assert response.json()["errors"][0]["field"] == "contact"
    assert fake_email.calls == []


async def test_contact_newline_in_name_rejected(client, fake_email):
    response = await client.post(CONTACT, json=payload(name="Ivan\nBcc: x"))

    assert response.status_code == 422
    assert fake_email.calls == []


@pytest.mark.parametrize(
    "field,value",
    [
        ("name", "n" * 101),
        ("name", ""),
        ("message", "m" * 5001),
        ("message", ""),
        ("message", "   "),
    ],
)
async def test_contact_length_limits(client, fake_email, field, value):
    response = await client.post(CONTACT, json=payload(**{field: value}))

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"
    assert fake_email.calls == []


async def test_contact_invalid_user_id(client):
    response = await client.post(CONTACT, json=payload(user_id="abc"))

    assert response.status_code == 422


async def test_contact_sender_error(client, fake_email):
    fake_email.error = RuntimeError("smtp down")

    response = await client.post(CONTACT, json=payload())

    assert response.status_code == 503
    assert response.json()["code"] == "CONTACT_REQUEST_FAILED"
