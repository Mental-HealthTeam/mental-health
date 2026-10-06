import logging
from datetime import datetime, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status
from redis import RedisError
from sqlalchemy import select, func
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
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
    AI_Session,
    AISessionSymptomCode
)
from sqlalchemy.orm import selectinload
from redis_storage.redis_interface import SessionStorageInterface
from config.dependencies import get_redis_storage
from schemas.psychologist import MockSlot

logger = logging.getLogger(__name__)


def _build_search_query(info):
    stmt = select(Psychologist, func.count(PsychologistSpecialization.symptom_code).label("count_matching")).join(
        PsychologistSpecialization, Psychologist.psychologist_id == PsychologistSpecialization.psychologist_id
    ).where(
        Psychologist.profile_status == PsychologistStatus.ACTIVE
    ).options(
        selectinload(Psychologist.psychologist_specializations)
    )
    if info.preferred_gender:
        stmt = stmt.where(
            Psychologist.gender == (info.preferred_gender)
        )
    if info.min_experience_years is not None:
        stmt = stmt.where(
            Psychologist.experience_years >= info.min_experience_years
        )
    if info.max_experience_years is not None:
        stmt = stmt.where(
            Psychologist.experience_years <= info.max_experience_years
        )
    if info.min_price_per_hour is not None:
        stmt = stmt.where(
            Psychologist.price_per_hour >= info.min_price_per_hour
        )
    if info.max_price_per_hour is not None:
        stmt = stmt.where(
            Psychologist.price_per_hour <= info.max_price_per_hour
        )

    stmt = stmt.where(PsychologistSpecialization.symptom_code.in_(info.symptom_codes)).group_by(
        Psychologist.psychologist_id
    ).order_by(func.count(PsychologistSpecialization.symptom_code).desc(), func.random())

    return stmt


def _filter_by_language(rows, languages):
    if languages:
        client_languages = set(languages)
        rows = [
            (psychologist, count) for psychologist, count in rows
            if set(psychologist.languages) & client_languages
        ]
    return rows


def _filter_by_time(rows, min_time, max_time):
    if min_time is not None and max_time is not None:
        rows = [
            (psychologist, _) for psychologist, _ in rows
            if any(
                min_time <= datetime.fromisoformat(time_slot["datetime"]) <= max_time
                for time_slot in psychologist.mock_slots or []
            )
        ]
    elif min_time is not None or max_time is not None:
        if min_time is not None:
            rows = [
                (psychologist, _) for psychologist, _ in rows
                if any(
                    datetime.fromisoformat(time_slot["datetime"]) >= min_time
                    for time_slot in psychologist.mock_slots or []
                )
            ]
        if max_time is not None:
            rows = [
                (psychologist, _) for psychologist, _ in rows
                if any(
                    datetime.fromisoformat(time_slot["datetime"]) <= max_time
                    for time_slot in psychologist.mock_slots or []
                )
            ]
    return rows


async def _log_ai_session(db, redis_storage, info, rows):
    try:
        ai_chat_info = await redis_storage.get_recording_info(info.session_id)
    except HTTPException:
        ai_chat_info = None
    except RedisError:
        logger.exception(
            "Redis unavailable while loading session %s",
            info.session_id
        )
        ai_chat_info = None
    if ai_chat_info is not None:
        try:
            stmt = select(AI_Session).options(
                selectinload(AI_Session.ai_session_symptom_codes)
            ).where(
                AI_Session.ai_session_id == info.session_id
            )
            response = await db.execute(stmt)
            ai_session_record = response.scalars().first()
            if not ai_session_record:
                ai_session_record = AI_Session(
                    ai_session_id=info.session_id,
                    user_id=None,  # TODO: Fix it, when Google auth will be implemented
                    messages_count=int(ai_chat_info["message_count"]),
                    duration_sec=int(datetime.now(timezone.utc).timestamp()) - int(ai_chat_info["created_at"]),
                    recommendations_count=len(rows)
                )
                db.add(ai_session_record)
                await db.flush()
                for symptom_code in set(info.symptom_codes):
                    ai_session_symptom_code = AISessionSymptomCode(
                        ai_session_log_id=ai_session_record.id,
                        symptom_code=symptom_code
                    )
                    db.add(ai_session_symptom_code)
            else:
                existing_symptom_codes = {s.symptom_code for s in ai_session_record.ai_session_symptom_codes}
                ai_session_record.messages_count = int(ai_chat_info["message_count"])
                ai_session_record.duration_sec = (
                    int(datetime.now(timezone.utc).timestamp()) - int(ai_chat_info["created_at"])
                )
                ai_session_record.recommendations_count = len(rows)
                new_symptom_codes = set(info.symptom_codes) - existing_symptom_codes
                for new_symptom_code in new_symptom_codes:
                    ai_session_symptom_code = AISessionSymptomCode(
                        ai_session_log_id=ai_session_record.id,
                        symptom_code=new_symptom_code
                    )
                    db.add(ai_session_symptom_code)
                invalid_symptom_codes = existing_symptom_codes - set(info.symptom_codes)
                for symptom_code in ai_session_record.ai_session_symptom_codes:
                    if symptom_code.symptom_code in invalid_symptom_codes:
                        await db.delete(symptom_code)
            await db.commit()
        except IntegrityError:
            await db.rollback()
            logger.warning(
                "AI session log already saved by a concurrent request (session_id=%s)",
                info.session_id,
            )
        except SQLAlchemyError:
            await db.rollback()
            logger.exception(
                "Failed to save AI session log (session_id=%s)",
                info.session_id,
            )


def _to_match_result(rows, symptom_codes):
    result = [
        PsychologistMatchResult(
            psychologist_id=psychologist.psychologist_id,
            full_name=psychologist.full_name,
            title=psychologist.title,
            avatar_url=psychologist.avatar_url,
            price_per_hour=psychologist.price_per_hour,
            languages=psychologist.languages,
            mock_slots=[
                MockSlot(time_label=slot["label"], time=slot["datetime"]) for slot in (psychologist.mock_slots or [])
            ],
            matched_symptom_codes=list(
                set(symptom_codes) & {
                    s.symptom_code for s in psychologist.psychologist_specializations
                }
            )
        )
        for psychologist, _ in rows
    ]
    return result


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
    info = request.matching_info
    stmt = _build_search_query(info=info)
    try:
        response = await db.execute(stmt)
        rows = response.all()
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while searching psychologists"
        ) from e

    rows = _filter_by_language(rows=rows, languages=info.language)
    rows = _filter_by_time(rows=rows, min_time=info.min_range_suitable_time, max_time=info.max_range_suitable_time)
    rows = rows[:3]

    result = _to_match_result(rows=rows, symptom_codes=info.symptom_codes)
    await _log_ai_session(db=db, redis_storage=redis_storage, info=info, rows=rows)

    return MatchingSearchResponse(result=result)
