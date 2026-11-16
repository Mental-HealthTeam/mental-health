from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from database import get_db
from database.models.models import Psychologist, User, UserRole
from schemas.auth import UserProfileResponse, UserProfileUpdate
from services.avatar_storage import delete_avatar_file, save_avatar
from config.dependencies import get_settings
from config.settings import BaseAppSettings
from exceptions.base import AppError

router = APIRouter()


async def build_profile_response(
    db: AsyncSession,
    user: User,
) -> UserProfileResponse:
    meet_link = None

    if user.role == UserRole.PSYCHOLOGIST:
        psychologist = await db.get(Psychologist, user.id)
        if psychologist is not None:
            meet_link = psychologist.meet_link

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        role=user.role,
        meet_link=meet_link,
    )


@router.get(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
)
async def get_user_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await build_profile_response(db, current_user)


@router.patch(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
)
async def update_user_profile(
    data: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    changes = data.model_dump(exclude_unset=True)

    if "meet_link" in changes:
        if current_user.role != UserRole.PSYCHOLOGIST:
            raise AppError(
                status.HTTP_403_FORBIDDEN,
                "MEETING_LINK_PSYCHOLOGIST_ONLY",
                "Only psychologists can update the meeting link.",
            )

        psychologist = await db.get(Psychologist, current_user.id)

        if psychologist is None:
            raise AppError(
                status.HTTP_404_NOT_FOUND,
                "PSYCHOLOGIST_PROFILE_NOT_FOUND",
                "Psychologist profile not found.",
            )

        psychologist.meet_link = changes.pop("meet_link")

    for field, value in changes.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)

    return await build_profile_response(db, current_user)


@router.post(
    "/me/avatar",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
)
async def upload_user_avatar(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    settings: Annotated[BaseAppSettings, Depends(get_settings)],
    file: UploadFile = File(...),
):
    old_avatar_url = current_user.avatar_url
    new_avatar_url = await save_avatar(file, current_user.id, settings)

    current_user.avatar_url = new_avatar_url

    try:
        await db.commit()
    except SQLAlchemyError as e:
        delete_avatar_file(new_avatar_url, current_user.id, settings)
        await db.rollback()
        raise AppError(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "AVATAR_UPLOAD_FAILED",
            "Could not upload your avatar try later",
        ) from e
    else:
        if old_avatar_url != new_avatar_url:
            delete_avatar_file(old_avatar_url, current_user.id, settings)

    return await build_profile_response(db, current_user)


@router.delete(
    "/me/avatar",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
)
async def delete_user_avatar(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    settings: Annotated[BaseAppSettings, Depends(get_settings)]
):
    old_avatar_url = current_user.avatar_url
    current_user.avatar_url = None

    await db.commit()

    delete_avatar_file(old_avatar_url, current_user.id, settings)

    return await build_profile_response(db, current_user)
