import io
import logging
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError


logger = logging.getLogger(__name__)

AVATAR_STORAGE_DIR = Path("media/avatars")
MAX_AVATAR_SIZE = 5 * 1024 * 1024

ALLOWED_FORMATS = {
    "JPEG": ".jpg",
    "PNG": ".png",
    "WEBP": ".webp",
}


def validate_image(content: bytes) -> str:
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Avatar file is empty.",
        )

    if len(content) > MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Avatar must not exceed 5 MB.",
        )

    try:
        with Image.open(io.BytesIO(content)) as image:
            image.verify()

        with Image.open(io.BytesIO(content)) as image:
            image_format = image.format

    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or unsupported image.",
        ) from None

    if image_format not in ALLOWED_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, and WebP images are supported.",
        )

    return ALLOWED_FORMATS[image_format]


async def save_avatar(file: UploadFile, user_id: uuid.UUID) -> str:
    content = await file.read(MAX_AVATAR_SIZE + 1)

    if len(content) > MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Avatar must not exceed 5 MB.",
        )

    extension = validate_image(content)
    AVATAR_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

    filename = f"{user_id}_{uuid.uuid4().hex}{extension}"
    destination = AVATAR_STORAGE_DIR / filename

    try:
        destination.write_bytes(content)
    except OSError:
        logger.exception("Failed to save avatar for user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save avatar.",
        ) from None

    return f"/media/avatars/{filename}"


def delete_avatar_file(avatar_url: str | None) -> None:
    if not avatar_url or not avatar_url.startswith("/media/avatars/"):
        return

    filename = avatar_url.removeprefix("/media/avatars/")
    if not filename or Path(filename).name != filename:
        return

    path = AVATAR_STORAGE_DIR / filename

    try:
        path.unlink(missing_ok=True)
    except OSError:
        logger.exception("Failed to delete avatar file %s", filename)
