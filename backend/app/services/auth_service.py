from datetime import datetime, timezone
import logging
from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy import select

from database.models.models import UserIdentity, UserRole, User
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from schemas.auth import ExternalIdentity
from sqlalchemy.orm import selectinload


logger = logging.getLogger(__name__)


async def find_identity(
        db: Annotated[AsyncSession, Depends(get_db)],
        identity: ExternalIdentity
) -> UserIdentity | None:
    stmt = select(UserIdentity).where(
        UserIdentity.provider == identity.provider,
        UserIdentity.provider_subject == identity.subject
    ).options(selectinload(UserIdentity.user))
    response = await db.execute(stmt)
    identity_record = response.scalars().first()
    return identity_record if identity_record else None


def _apply_profile(user, identity):
    for field, value in identity.model_dump(
            include={"name", "avatar_url"},
            exclude_none=True
    ).items():
        setattr(user, field, value)
    user.last_login_at = datetime.now(timezone.utc)


async def get_or_create_user(
        db: Annotated[AsyncSession, Depends(get_db)],
        identity: ExternalIdentity
) -> User:
    identity_record = await find_identity(db=db, identity=identity)
    if identity_record:
        _apply_profile(user=identity_record.user, identity=identity)
        await db.commit()
        return identity_record.user
    stmt = select(User).where(
        User.email == identity.email
    )
    response = await db.execute(stmt)
    user = response.scalars().first()
    try:
        if user:
            user_identity_record = UserIdentity(
                user_id=user.id,
                provider=identity.provider,
                provider_subject=identity.subject,
            )
            db.add(user_identity_record)
            _apply_profile(user=user, identity=identity)
        else:
            user = User(
                email=identity.email,
                role=UserRole.CLIENT,
            )
            _apply_profile(user=user, identity=identity)
            db.add(user)
            await db.flush()
            user_identity_record = UserIdentity(
                user_id=user.id,
                provider=identity.provider,
                provider_subject=identity.subject,
            )
            db.add(user_identity_record)
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        existing_email = (await db.execute(select(User).where(
            User.email == identity.email
        ))).scalars().first()
        if not existing_email:
            logger.exception(
                "Failed to create user",
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error while signing in"
            ) from e
        existing_identity = await find_identity(db=db, identity=identity)
        if existing_identity is None:
            logger.exception(
                "Failed to create user identity (provider=%s)",
                identity.provider.value,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error while signing in"
            ) from e
        user = existing_identity.user
        logger.warning(
            "Identity was created by a concurrent login (provider=%s, subject=%s)",
            identity.provider.value,
            identity.subject,
        )

    except SQLAlchemyError as e:
        await db.rollback()
        logger.exception(
            "Database error during login (provider=%s)",
            identity.provider.value,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while signing in"
        ) from e
    return user
