from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.matching import (
    MatchingSearchRequest,
    MatchingSearchResponse,
    PsychologistMatchResult
)
from database.models.models import (
    PsychologistSpecialization,
    Psychologist,
    PsychologistStatus,
)
from sqlalchemy.orm import selectinload
from config.dependencies import get_redis_storage
from redis_storage.redis_interface import SessionStorageInterface


async def find_matching_psychologists(
    db: Annotated[AsyncSession, Depends(get_db)],
    redis_storage: Annotated[SessionStorageInterface, Depends(get_redis_storage)],
    request: MatchingSearchRequest
):
    if request.matching_info is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="matching_info is required"
        )
    stmt = select(Psychologist, func.count(PsychologistSpecialization.symptom_code).label("count_matching")).join(
        PsychologistSpecialization, Psychologist.psychologist_id == PsychologistSpecialization.psychologist_id
    ).where(
        Psychologist.profile_status == PsychologistStatus.ACTIVE
    ).options(
        selectinload(Psychologist.psychologist_specializations)
    )
    if request.matching_info.preferred_gender:
        stmt = stmt.where(
            Psychologist.gender == (request.matching_info.preferred_gender)
        )
    if request.matching_info.min_experience_years is not None:
        stmt = stmt.where(
            Psychologist.experience_years >= request.matching_info.min_experience_years
        )
    if request.matching_info.min_price_per_hour is not None:
        stmt = stmt.where(
            Psychologist.price_per_hour >= request.matching_info.min_price_per_hour
        )
    if request.matching_info.max_price_per_hour is not None:
        stmt = stmt.where(
            Psychologist.price_per_hour <= request.matching_info.max_price_per_hour
        )

    stmt = stmt.where(PsychologistSpecialization.symptom_code.in_(request.matching_info.symptom_codes)).group_by(
        Psychologist.psychologist_id
    ).order_by(func.count(PsychologistSpecialization.symptom_code).desc(), func.random()).limit(3)
    try:
        response = await db.execute(stmt)
        rows = response.all()
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while searching psychologists"
        ) from e

    if request.matching_info.language:
        client_languages = set(request.matching_info.language)
        rows = [
            (psychologist, count) for psychologist, count in rows
            if set(psychologist.languages) & client_languages
        ]
    result = [
        PsychologistMatchResult(
            psychologist_id=psychologist.psychologist_id,
            full_name=psychologist.full_name,
            title=psychologist.title,
            avatar_url=psychologist.avatar_url,
            price_per_hour=psychologist.price_per_hour,
            languages=psychologist.languages,
            mock_slots=psychologist.mock_slots,
            matched_symptom_codes=list(
                set(request.matching_info.symptom_codes) & {s.symptom_code
                for s in psychologist.psychologist_specializations}
            )
        )
        for psychologist, _ in rows
    ]
    try:


    return MatchingSearchResponse(result=result)






