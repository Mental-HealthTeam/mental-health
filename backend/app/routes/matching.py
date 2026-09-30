from typing import Annotated

from fastapi import APIRouter, status, Depends


from services.matching_service import find_matching_psychologists
from database import get_db
from schemas.matching import MatchingSearchResponse, MatchingSearchRequest
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.post(
    "/matching/search",
    status_code=status.HTTP_200_OK,
    response_model=MatchingSearchResponse
)
async def search_psychologists(
    db: Annotated[AsyncSession, Depends(get_db)],
    request: MatchingSearchRequest
):
    return await find_matching_psychologists(
        db=db,
        request=request
    )
