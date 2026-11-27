import logging

from fastapi import status, UploadFile
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession


from database.models.models import (
    User,
    UserRole,
    Psychologist,
    UserSymptomCode
)
from exceptions.base import AppError
from schemas.users import UserProfileResponse, UserProfileUpdate
from sqlalchemy.orm import selectinload
from storage.storage_interface import AvatarStorageInterface

logger = logging.getLogger(__name__)


async def build_profile_response(
    db: AsyncSession,
    user: User,
) -> UserProfileResponse:
    meet_link = None

    if user.role == UserRole.PSYCHOLOGIST:
        psychologist = await db.get(Psychologist, user.id)
        if psychologist is not None:
            meet_link = psychologist.meet_link
    topics = sorted([
        topic.symptom_code.value for topic in user.user_symptom_codes
    ])
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        role=user.role,
        meet_link=meet_link,
        telegram=user.telegram,
        topics=topics,
        allow_notifications=user.allow_notifications
    )


async def update_user_profile_service(
    data: UserProfileUpdate,
    db: AsyncSession,
    current_user: User,
):
    changes = data.model_dump(exclude_unset=True)

    if "topics" in changes:
        topics = changes.pop("topics")
        if topics is not None:
            symptom_codes = list(dict.fromkeys(topics))
            current_user.user_symptom_codes.clear()
            current_user.user_symptom_codes.extend(
                UserSymptomCode(
                    user_id=current_user.id,
                    symptom_code=symptom_code
                )
                for symptom_code in symptom_codes
            )
    if "telegram" in changes:
        telegram = changes.pop("telegram")
        if telegram:
            stmt = select(User).where(
                User.telegram == telegram
            )
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            is_taken = user is not None
            if (
                is_taken
                and user != current_user
            ):
                raise AppError(
                    status.HTTP_409_CONFLICT,
                    "TELEGRAM_ALREADY_TAKEN",
                    "This Telegram username is already used by another account.",
                )
        current_user.telegram = telegram
    if "allow_notifications" in changes:
        allow_notifications = changes.pop("allow_notifications")
        if allow_notifications is not None:
            current_user.allow_notifications = allow_notifications
    for field, value in changes.items():
        setattr(current_user, field, value)
    try:
        await db.commit()
    except IntegrityError as e:
        current_user_id = current_user.id
        await db.rollback()
        logger.warning(
            "Profile update conflict (user_id=%s)", current_user_id
        )
        raise AppError(
            status.HTTP_409_CONFLICT,
            "TELEGRAM_ALREADY_TAKEN",
            "This Telegram username is already used by another account.",
        ) from e
    except SQLAlchemyError as e:
        current_user_id = current_user.id
        await db.rollback()
        logger.exception(
            "Failed to update profile (user_id=%s)", current_user_id
        )
        raise AppError(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "USER_PROFILE_UPDATE_FAILED",
            "Could not update your profile. Please try again later.",
        ) from e
    stmt = select(User).where(
        User.id == current_user.id
    ).options(
        selectinload(User.user_symptom_codes)
    )
    response = await db.execute(stmt)
    user = response.scalars().first()

    return await build_profile_response(db, user)


async def upload_user_avatar_service(
    db: AsyncSession,
    current_user: User,
    storage: AvatarStorageInterface,
    file: UploadFile,
):
    old_avatar_url = current_user.avatar_url
    new_avatar_url = await storage.save_avatar(file, current_user.id)

    current_user.avatar_url = new_avatar_url

    try:
        await db.commit()
    except SQLAlchemyError as e:
        storage.delete_avatar_file(new_avatar_url, current_user.id)
        await db.rollback()
        raise AppError(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "AVATAR_UPLOAD_FAILED",
            "Could not upload your avatar try later",
        ) from e
    else:
        if old_avatar_url != new_avatar_url:
            storage.delete_avatar_file(old_avatar_url, current_user.id)

    return await build_profile_response(db, current_user)


async def delete_user_avatar_service(
    db: AsyncSession,
    current_user: User,
    storage: AvatarStorageInterface,
):
    old_avatar_url = current_user.avatar_url
    current_user.avatar_url = None
    try:
        await db.commit()
    except SQLAlchemyError as e:
        await db.rollback()
        raise AppError(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "AVATAR_DELETE_FAILED",
            "Could not delete your avatar."
        ) from e

    storage.delete_avatar_file(old_avatar_url, current_user.id)

    return await build_profile_response(db, current_user)
