from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from database import get_db
from database.models.models import User
from schemas.users import UserProfileResponse, UserProfileUpdate
from config.dependencies import get_settings
from config.settings import BaseAppSettings
from services.users_service import (
    build_profile_response,
    update_user_profile_service,
    upload_user_avatar_service,
    delete_user_avatar_service
)


router = APIRouter()


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
    return await update_user_profile_service(
        data=data,
        db=db,
        current_user=current_user
    )


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
    return await upload_user_avatar_service(
        db=db,
        current_user=current_user,
        settings=settings,
        file=file
    )


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
    return await delete_user_avatar_service(
        db=db,
        current_user=current_user,
        settings=settings
    )
