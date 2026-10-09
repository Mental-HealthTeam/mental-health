import logging
from datetime import datetime, timezone, timedelta
import uuid
from typing import Annotated
from fastapi import Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from database.models.models import User
from auth.token_interface import JWTAuthManagerInterface
from config.dependencies import get_jwt_manager, get_settings
from database.models.models import AuthSession
from config.settings import BaseAppSettings
from schemas.auth import (
    SessionCreateData,
    TokenPair,
    SessionRotateData,
    RevokeSessionSchema,
    RevokeAllSchema
)
from exceptions.auth_provider import TokenExpiredError, InvalidTokenError

logger = logging.getLogger(__name__)


async def create_session(
        db: Annotated[AsyncSession, Depends(get_db)],
        jwt_manager: Annotated[JWTAuthManagerInterface, Depends(get_jwt_manager)],
        settings: Annotated[BaseAppSettings, Depends(get_settings)],
        data: SessionCreateData,
) -> TokenPair:
    user = await db.get(User, data.user_id)
    if not user:
        logger.warning(
            "Cannot create session: user not found (user_id=%s)", data.user_id
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    jti = uuid.uuid4()
    family_id = data.family_id or uuid.uuid4()
    now = datetime.now(timezone.utc)
    try:
        auth_session = AuthSession(
            user_id=data.user_id,
            family_id=family_id,
            jti=jti,
            expires_at=now + timedelta(minutes=settings.refresh_ttl_min),
            user_agent=data.user_agent,
            ip=data.ip
        )
        db.add(auth_session)
        payload_access = {
            "sub": str(data.user_id),
            "role": user.role.value,
            "type": "access",
            "iat": now
        }
        payload_refresh = {
            "sub": str(data.user_id),
            "family_id": str(family_id),
            "jti": str(jti),
            "type": "refresh",
            "iat": now
        }
        access_token = jwt_manager.create_access_token(
            data=payload_access,
            expires_delta=timedelta(minutes=settings.ACCESS_TTL_MIN)
        )
        refresh_token = jwt_manager.create_refresh_token(
            data=payload_refresh,
            expires_delta=timedelta(minutes=settings.refresh_ttl_min)
        )
        await db.commit()
    except SQLAlchemyError as e:
        await db.rollback()
        logger.exception(
            "Failed to create auth session (user_id=%s)",
            data.user_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while signing in"
        ) from e

    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token
    )


async def rotate_session(
        db: Annotated[AsyncSession, Depends(get_db)],
        jwt_manager: Annotated[JWTAuthManagerInterface, Depends(get_jwt_manager)],
        settings: Annotated[BaseAppSettings, Depends(get_settings)],
        data: SessionRotateData,
):
    try:
        token_info = jwt_manager.decode_refresh_token(token=data.refresh_token)
    except (TokenExpiredError, InvalidTokenError) as e:
        logger.info("Refresh token rejected: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token."
        ) from e
    try:
        user_id = uuid.UUID(token_info["sub"])
        jti = uuid.UUID(token_info["jti"])
    except (KeyError, ValueError) as e:
        logger.warning(
            "Refresh token has malformed claims"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token."
        ) from e
    stmt = select(AuthSession).where(
        AuthSession.jti == jti
    ).options(
        selectinload(AuthSession.user)
    ).with_for_update()
    response = await db.execute(stmt)
    auth_session = response.scalars().first()

    if not auth_session:
        logger.warning(
            "Refresh rejected: session not found (jti=%s)", jti
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token."
        )
    if auth_session.revoked_at is not None:
        logger.warning(
            "Refresh token reuse detected, revoking family (user_id=%s, family_id=%s)",
            auth_session.user_id,
            auth_session.family_id
        )
        await revoke_family(db=db, family_id=auth_session.family_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token."
        )

    if auth_session.expires_at <= datetime.now(timezone.utc):
        logger.warning(
            "Refresh rejected: session expired (user_id=%s, family_id=%s)",
            auth_session.user_id, auth_session.family_id
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token."
        )
    if auth_session.user_id != user_id:
        logger.warning(
            "Refresh rejected: token user does not match session (token_user_id=%s, session_user_id=%s)",
            user_id, auth_session.user_id
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token."
        )

    now = datetime.now(timezone.utc)
    try:
        new_auth_session = AuthSession(
            user_id=auth_session.user.id,
            family_id=auth_session.family_id,
            jti=uuid.uuid4(),
            expires_at=now + timedelta(minutes=settings.refresh_ttl_min),
            user_agent=data.user_agent,
            ip=data.ip
        )
        db.add(new_auth_session)
        await db.flush()
        auth_session.revoked_at = now
        auth_session.replaced_by = new_auth_session.jti
        payload_access = {
            "sub": str(auth_session.user.id),
            "role": str(auth_session.user.role.value),
            "type": "access",
            "iat": now
        }
        payload_refresh = {
            "sub": str(auth_session.user.id),
            "family_id": str(auth_session.family_id),
            "jti": str(new_auth_session.jti),
            "type": "refresh",
            "iat": now
        }
        access_token = jwt_manager.create_access_token(
            data=payload_access,
            expires_delta=timedelta(minutes=settings.ACCESS_TTL_MIN)
        )
        refresh_token = jwt_manager.create_refresh_token(
            data=payload_refresh,
            expires_delta=timedelta(minutes=settings.refresh_ttl_min)
        )
        await db.commit()
    except SQLAlchemyError as e:
        await db.rollback()
        logger.exception(
            "Failed to rotate auth session (user_id=%s)",
            user_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while signing in"
        ) from e
    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token
    )


async def revoke_family(
        db: Annotated[AsyncSession, Depends(get_db)],
        family_id: uuid.UUID
):
    try:
        await db.execute(
            update(AuthSession)
            .where(
                AuthSession.family_id == family_id,
                AuthSession.revoked_at.is_(None)
            )
            .values(
                revoked_at=datetime.now(timezone.utc)
            )
        )
        await db.commit()
        logger.info("Session family revoked (family_id=%s)", family_id)
    except SQLAlchemyError as e:
        await db.rollback()
        logger.exception(
            "Failed to revoke auth session family (family_id=%s)",
            family_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while revoking session"
        ) from e


async def revoke_session(
        db: Annotated[AsyncSession, Depends(get_db)],
        jwt_manager: Annotated[JWTAuthManagerInterface, Depends(get_jwt_manager)],
        data: RevokeSessionSchema
):
    try:
        token_info = jwt_manager.decode_refresh_token(token=data.refresh_token)
    except (TokenExpiredError, InvalidTokenError):
        logger.debug("Logout: nothing to revoke, token is not valid")
        return
    try:
        family_id = uuid.UUID(token_info["family_id"])
    except (KeyError, ValueError):
        logger.debug("Logout: nothing to revoke, token is not valid")
        return
    await revoke_family(
        db=db,
        family_id=family_id
    )


async def revoke_all_sessions(
        db: Annotated[AsyncSession, Depends(get_db)],
        jwt_manager: Annotated[JWTAuthManagerInterface, Depends(get_jwt_manager)],
        data: RevokeAllSchema
):
    try:
        token_info = jwt_manager.decode_refresh_token(token=data.refresh_token)
    except (TokenExpiredError, InvalidTokenError) as e:
        logger.warning("Logout-all rejected: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token."
        ) from e
    try:
        user_id = uuid.UUID(token_info["sub"])
    except (KeyError, ValueError) as e:
        logger.warning("Logout-all rejected: malformed claims")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token."
        ) from e
    try:
        await db.execute(
            update(AuthSession)
            .where(
                AuthSession.user_id == user_id,
                AuthSession.revoked_at.is_(None)
            )
            .values(revoked_at=datetime.now(timezone.utc))
        )
        await db.commit()
        logger.info("All sessions revoked (user_id=%s)", user_id)
    except SQLAlchemyError as e:
        await db.rollback()
        logger.exception(
            "Failed to revoke all sessions (user_id=%s)",
            user_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while revoking all sessions"
        ) from e
