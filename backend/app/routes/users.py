from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from database import get_db
from database.models.models import Psychologist, User, UserRole
from schemas.auth import UserProfileResponse, UserProfileUpdate


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
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only psychologists can update the meeting link.",
            )

        psychologist = await db.get(Psychologist, current_user.id)

        if psychologist is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Psychologist profile not found.",
            )

        psychologist.meet_link = changes.pop("meet_link")

    for field, value in changes.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)

    return await build_profile_response(db, current_user)
