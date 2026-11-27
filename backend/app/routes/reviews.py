from typing import Annotated
from fastapi import Depends, status, APIRouter
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import require_roles
from database import get_db
from database.models.models import UserRole, User
from schemas.reviews import ReviewCreate, ReviewResponse
from services.review_service import create_comment_service

router = APIRouter()


@router.post(
    "",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_comment(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(UserRole.CLIENT))],
    data: ReviewCreate
):
    return await create_comment_service(
        db=db,
        current_user=current_user,
        data=data
    )
