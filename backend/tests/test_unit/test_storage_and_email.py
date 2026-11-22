import io
import logging
import uuid
from email.message import EmailMessage
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from PIL import Image
from starlette.datastructures import UploadFile

from email_sender.contact_sender import ContactService


async def save(storage, content, user_id):
    upload = UploadFile(file=io.BytesIO(content), filename="a.png")
    return await storage.save_avatar(upload, user_id)


async def test_save_avatar_recodes_image(avatar_storage, make_image, settings):
    user_id = uuid.uuid4()

    url = await save(avatar_storage, make_image("JPEG"), user_id)

    name = url.removeprefix(settings.AVATAR_STORAGE_URL)
    stored = Path(settings.AVATAR_STORAGE_DIR) / name
    assert name.startswith(f"{user_id}_") and name.endswith(".jpg")
    with Image.open(stored) as image:
        assert image.format == "JPEG"


def put_file(settings, name):
    folder = Path(settings.AVATAR_STORAGE_DIR)
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / name
    path.write_bytes(b"data")
    return path


def test_delete_removes_own_file(avatar_storage, settings):
    user_id = uuid.uuid4()
    path = put_file(settings, f"{user_id}_abc.png")

    avatar_storage.delete_avatar_file(
        f"{settings.AVATAR_STORAGE_URL}{path.name}", user_id
    )

    assert not path.exists()


def test_delete_refuses_foreign_file(avatar_storage, settings):
    path = put_file(settings, f"{uuid.uuid4()}_abc.png")

    avatar_storage.delete_avatar_file(
        f"{settings.AVATAR_STORAGE_URL}{path.name}", uuid.uuid4()
    )

    assert path.exists()


@pytest.mark.parametrize(
    "url",
    [None, "", "https://other.site/a.png", "/media/avatars/../secret.txt"],
)
def test_delete_ignores_unsafe_urls(avatar_storage, settings, url):
    path = put_file(settings, "keep.png")

    avatar_storage.delete_avatar_file(url, uuid.uuid4())

    assert path.exists()


def make_service(**overrides):
    params = dict(
        contact_support_email="support@platform.com",
        smtp_port=587,
        smtp_host="smtp.test",
        smtp_from_email="from@platform.com",
        environment="production",
        smtp_use_tls=True,
        smtp_username="user",
        smtp_password="secret",
    )
    params.update(overrides)
    return ContactService(**params)


async def test_contact_service_requires_smtp_outside_development():
    service = make_service(smtp_host="")

    with pytest.raises(RuntimeError):
        await service.send_contact_message("Ivan", "my_user", "Hi")


async def test_contact_service_development_only_logs(caplog):
    service = make_service(smtp_host="", environment="development")

    with caplog.at_level(logging.INFO):
        await service.send_contact_message("Ivan", "my_user", "Hi there")

    assert "Hi there" in caplog.text


async def test_contact_service_builds_and_sends_email():
    smtp = MagicMock()
    smtp.__enter__.return_value = smtp

    with patch("email_sender.contact_sender.smtplib.SMTP", return_value=smtp) as ctor:
        await make_service().send_contact_message(
            "Ivan", "my_user", "Hello", user_id="42"
        )

    ctor.assert_called_once_with("smtp.test", 587, timeout=10)
    smtp.starttls.assert_called_once()
    smtp.login.assert_called_once_with("user", "secret")
    sent: EmailMessage = smtp.send_message.call_args.args[0]
    assert sent["Subject"] == "New contact request from Ivan"
    assert sent["From"] == "from@platform.com"
    assert sent["To"] == "support@platform.com"
    assert sent["Reply-To"] == "my_user"
    body = sent.get_content()
    assert "User ID: 42" in body and "Hello" in body


async def test_contact_service_skips_tls_and_login_when_not_configured():
    smtp = MagicMock()
    smtp.__enter__.return_value = smtp
    service = make_service(smtp_use_tls=False, smtp_username="", smtp_password="")

    with patch("email_sender.contact_sender.smtplib.SMTP", return_value=smtp):
        await service.send_contact_message("Ivan", "my_user", "Hello")

    smtp.starttls.assert_not_called()
    smtp.login.assert_not_called()
    smtp.send_message.assert_called_once()
