import asyncio
import io
import logging
import uuid
from pathlib import Path

from fastapi import UploadFile, status
from PIL import Image, UnidentifiedImageError, ImageOps

from config.settings import BaseAppSettings
from exceptions.base import AppError

logger = logging.getLogger(__name__)

ALLOWED_FORMATS = {
    "JPEG": ".jpg",
    "PNG": ".png",
    "WEBP": ".webp",
}

SAVE_OPTIONS = {
    "JPEG": {"quality": 85, "optimize": True},
    "PNG": {"optimize": True},
    "WEBP": {"quality": 85},
}


def recode_image(content: bytes, image_format: str):
    try:
        with Image.open(io.BytesIO(content)) as image:
            image = ImageOps.exif_transpose(image)
            has_alpha = (
                image.mode in ("RGBA", "LA", "PA")
                or "transparency" in image.info
            )
            mode = "RGBA" if has_alpha and image_format != "JPEG" else "RGB"
            pixels = image.convert(mode)

            clean = Image.new(mode, pixels.size)
            clean.paste(pixels)

            output = io.BytesIO()
            clean.save(output, format=image_format, **SAVE_OPTIONS[image_format])
    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        SyntaxError,
        Image.DecompressionBombError
    ) as e:
        raise AppError(
            status.HTTP_400_BAD_REQUEST,
            "AVATAR_INVALID_IMAGE",
            "Invalid or unsupported image.",
        ) from e

    return output.getvalue()


def validate_image(
        content: bytes,
        max_avatar_pixels: int
) -> str:
    if not content:
        raise AppError(
            status.HTTP_400_BAD_REQUEST,
            "AVATAR_EMPTY",
            "Avatar file is empty.",
        )

    try:
        with Image.open(io.BytesIO(content)) as image:
            image_format = image.format
            width, height = image.width, image.height
            if width * height > max_avatar_pixels:
                raise AppError(
                    status.HTTP_400_BAD_REQUEST,
                    "AVATAR_DIMENSIONS_TOO_LARGE",
                    "Image dimensions are too large.",
                )
            image.verify()

    except (
            UnidentifiedImageError,
            OSError,
            SyntaxError,
            Image.DecompressionBombError
    ):
        raise AppError(
            status.HTTP_400_BAD_REQUEST,
            "AVATAR_INVALID_IMAGE",
            "Invalid or unsupported image.",
        ) from None

    if image_format not in ALLOWED_FORMATS:
        raise AppError(
            status.HTTP_400_BAD_REQUEST,
            "AVATAR_UNSUPPORTED_FORMAT",
            "Only JPEG, PNG, and WebP images are supported.",
        )

    return image_format


async def save_avatar(
        file: UploadFile,
        user_id: uuid.UUID,
        settings: BaseAppSettings
) -> str:
    content = await file.read(settings.MAX_AVATAR_UPLOAD_SIZE + 1)
    if len(content) > settings.MAX_AVATAR_UPLOAD_SIZE:
        raise AppError(
            status.HTTP_413_CONTENT_TOO_LARGE,
            "AVATAR_TOO_LARGE",
            "Avatar file is too large.",
        )
    image_format = validate_image(content, settings.MAX_AVATAR_PIXELS)
    extension = ALLOWED_FORMATS[image_format]
    content = await asyncio.to_thread(
        recode_image,
        content=content,
        image_format=image_format
    )

    if len(content) > settings.MAX_AVATAR_SIZE:
        raise AppError(
            status.HTTP_413_CONTENT_TOO_LARGE,
            "AVATAR_TOO_LARGE",
            "Avatar must not exceed 5 MB.",
        )

    avatar_storage_dir = Path(settings.AVATAR_STORAGE_DIR)
    avatar_storage_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{user_id}_{uuid.uuid4().hex}{extension}"
    destination = avatar_storage_dir / filename

    try:
        destination.write_bytes(content)
    except OSError:
        logger.exception("Failed to save avatar for user %s", user_id)
        raise AppError(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "AVATAR_UPLOAD_FAILED",
            "Failed to save avatar.",
        ) from None

    return f"{settings.AVATAR_STORAGE_URL}{filename}"


def delete_avatar_file(
    avatar_url: str | None,
    user_id: uuid.UUID,
    settings: BaseAppSettings
) -> None:
    if not avatar_url or not avatar_url.startswith(settings.AVATAR_STORAGE_URL):
        return

    filename = avatar_url.removeprefix(settings.AVATAR_STORAGE_URL)

    if not filename or Path(filename).name != filename:
        return

    if not filename.startswith(f"{user_id}_"):
        logger.warning(
            "Refusing to delete avatar not owned by user %s",
            user_id,
        )
        return

    path = Path(settings.AVATAR_STORAGE_DIR) / filename

    try:
        path.unlink(missing_ok=True)
    except OSError:
        logger.exception("Failed to delete avatar file %s", filename)
