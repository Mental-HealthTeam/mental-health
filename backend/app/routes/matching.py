from typing import Annotated
from fastapi import APIRouter, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from services.matching_service import find_matching_psychologists
from database import get_db
from schemas.matching import MatchingSearchResponse, MatchingSearchRequest
from redis_storage.redis_interface import SessionStorageInterface
from config.dependencies import get_redis_storage

router = APIRouter()


@router.post(
    "/matching/search",
    status_code=status.HTTP_200_OK,
    response_model=MatchingSearchResponse,
    summary="Find psychologists matching the AI chat's criteria",
    response_description="Up to 3 psychologists ranked by symptom_code overlap",
    responses={
        400: {
            "description": "`matching_info` was not provided: the AI has not collected enough data yet",
            "content": {
                "application/json": {
                    "example": {"detail": "matching_info is required"}
                }
            },
        },
        422: {
            "description": (
                "Request body failed validation, e.g. an unknown `symptom_codes` value, "
                "an invalid `preferred_gender` or a malformed datetime"
            ),
            "content": {
                "application/json": {
                    "example": {
                        "detail": [
                            {
                                "type": "enum",
                                "loc": ["body", "matching_info", "symptom_codes", 0],
                                "msg": "Input should be 'anxiety', 'burnout', 'relationship', ...",
                            }
                        ]
                    }
                }
            },
        },
        500: {
            "description": "Database error while searching psychologists",
            "content": {
                "application/json": {
                    "example": {"detail": "Database error while searching psychologists"}
                }
            },
        },
    },
)
async def search_psychologists(
    db: Annotated[AsyncSession, Depends(get_db)],
    redis_storage: Annotated[SessionStorageInterface, Depends(get_redis_storage)],
    request: MatchingSearchRequest
):
    """
    Called when the client presses the "find a psychologist" button in the AI chat.

    Takes the `matching_info` block the AI produced (`symptom_codes` plus
    optional `preferred_gender` / price / experience / time-range filters)
    and returns up to 3 active psychologists, ranked by how many
    `symptom_codes` overlap with the request, ties broken randomly.

    `min_range_suitable_time` / `max_range_suitable_time` should carry a UTC
    offset (e.g. `2026-10-02T14:00:00+03:00`); a value without one is treated
    as Europe/Kyiv time.

    Logging the AI chat session is best-effort: if the Redis session is gone
    or the log cannot be saved, the search results are still returned.
    """
    return await find_matching_psychologists(
        db=db,
        redis_storage=redis_storage,
        request=request
    )
