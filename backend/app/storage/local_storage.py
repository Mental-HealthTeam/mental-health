import asyncio
import io
import logging
import uuid
from pathlib import Path

from fastapi import UploadFile, status
from PIL import Image, UnidentifiedImageError, ImageOps

from exceptions.base import AppError
from storage.storage_interface import AvatarStorageInterface

logger = logging.getLogger(__name__)


class AvatarLocalStorage(AvatarStorageInterface):

    def __init__(
            self,
            max_avatar_upload_size: int,
            max_avatar_size: int,
            max_avatar_pixels: int,
            avatar_storage_dir: str,
            avatar_storage_url: str
    ):
        self.max_avatar_upload_size = max_avatar_upload_size
        self.max_avatar_size = max_avatar_size
        self.max_avatar_pixels = max_avatar_pixels
        self.avatar_storage_dir = avatar_storage_dir
        self.avatar_storage_url = avatar_storage_url


    SAVE_OPTIONS = {
        "JPEG": {"quality": 85, "optimize": True},
        "PNG": {"optimize": True},
        "WEBP": {"quality": 85},
    }


    ALLOWED_FORMATS = {
        "JPEG": ".jpg",
        "PNG": ".png",
        "WEBP": ".webp",
    }


    def _recode_image(self, content: bytes, image_format: str):
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
                clean.save(output, format=image_format, **self.SAVE_OPTIONS[image_format])
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


    def _validate_image(
            self,
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

        if image_format not in self.ALLOWED_FORMATS:
            raise AppError(
                status.HTTP_400_BAD_REQUEST,
                "AVATAR_UNSUPPORTED_FORMAT",
                "Only JPEG, PNG, and WebP images are supported.",
            )

        return image_format


    async def save_avatar(
            self,
            file: UploadFile,
            user_id: uuid.UUID,
    ) -> str:
        content = await file.read(self.max_avatar_upload_size + 1)
        if len(content) > self.max_avatar_upload_size:
            raise AppError(
                status.HTTP_413_CONTENT_TOO_LARGE,
                "AVATAR_TOO_LARGE",
                "Avatar file is too large.",
            )
        image_format = self._validate_image(content, self.max_avatar_pixels)
        extension = self.ALLOWED_FORMATS[image_format]
        content = await asyncio.to_thread(
            self._recode_image,
            content=content,
            image_format=image_format
        )

        if len(content) > self.max_avatar_size:
            raise AppError(
                status.HTTP_413_CONTENT_TOO_LARGE,
                "AVATAR_TOO_LARGE",
                "Avatar must not exceed 5 MB.",
            )

        avatar_storage_dir = Path(self.avatar_storage_dir)
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

        return f"{self.avatar_storage_url}{filename}"


    def delete_avatar_file(
        self,
        avatar_url: str | None,
        user_id: uuid.UUID,
    ) -> None:
        if not avatar_url or not avatar_url.startswith(self.avatar_storage_url):
            return

        filename = avatar_url.removeprefix(self.avatar_storage_url)

        if not filename or Path(filename).name != filename:
            return

        if not filename.startswith(f"{user_id}_"):
            logger.warning(
                "Refusing to delete avatar not owned by user %s",
                user_id,
            )
            return

        path = Path(self.avatar_storage_dir) / filename

        try:
            path.unlink(missing_ok=True)
        except OSError:
            logger.exception("Failed to delete avatar file %s", filename)
