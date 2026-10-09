import logging
import uuid
from typing import Annotated, Callable, Coroutine, Any
from fastapi import (
    Depends,
    HTTPException,
    status,
    Request
)

from database import get_db
from config.settings import BaseAppSettings
from auth.google_provider import GoogleAuthProvider
from config.dependencies import get_settings, get_jwt_manager
from auth.token_interface import JWTAuthManagerInterface
from sqlalchemy.ext.asyncio import AsyncSession
from database.models.models import User, UserRole
from exceptions.auth_provider import BaseSecurityError
from schemas.auth import ClientInfo


logger = logging.getLogger(__name__)


def get_access_token(
    request: Request,
    settings: Annotated[BaseAppSettings, Depends(get_settings)]
) -> str:
    access_token = request.cookies.get(settings.ACCESS_COOKIE)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return access_token


def get_refresh_token(
    request: Request,
    settings: Annotated[BaseAppSettings, Depends(get_settings)]
) -> str:
    refresh_token = request.cookies.get(settings.REFRESH_COOKIE)
    if not refresh_token:
        logger.debug("Refresh rejected: no refresh cookie")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return refresh_token


def get_client_info(request: Request) -> ClientInfo:
    user_agent = request.headers.get("user-agent")
    ip = request.client.host if request.client is not None else None

    return ClientInfo(
        user_agent=user_agent,
        ip=ip
    )


def get_google_provider(
    settings: Annotated[BaseAppSettings, Depends(get_settings)]
):
    return GoogleAuthProvider(
        client_id=settings.GOOGLE_CLIENT_ID
    )


async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    jwt_manager: Annotated[JWTAuthManagerInterface, Depends(get_jwt_manager)],
    access_token: Annotated[str, Depends(get_access_token)]
):
    try:
        payload = jwt_manager.decode_access_token(access_token)
    except BaseSecurityError as e:
        logger.debug("Access token rejected: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        ) from e

    try:
        user_id = uuid.UUID(payload["sub"])
        token_type = payload["type"]
    except (KeyError, ValueError) as e:
        logger.warning("Access token has malformed claims")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        ) from e
    if token_type != "access":
        logger.warning("Access token has wrong type (type=%s)", token_type)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    user = await db.get(User, user_id)
    if user is None:
        logger.warning("Access token for unknown user (user_id=%s)", user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    return user


def require_roles(*allowed_roles: UserRole) -> Callable[..., Coroutine[Any, Any, User]]:
    async def role_checker(
            current_user: Annotated[User, Depends(get_current_user)]
    ):
        if current_user.role not in allowed_roles:
            logger.info(
                "Access denied (user_id=%s, role=%s, required=%s)",
                current_user.id, current_user.role.value,
                [r.value for r in allowed_roles]
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action."
            )
        return current_user
    return role_checker


def verify_origin(
        request: Request,
        settings: Annotated[BaseAppSettings, Depends(get_settings)]
):
    origin = request.headers.get("Origin")
    if not origin:
        logger.debug("Request without Origin header (path=%s)", request.url.path)
        return
    for allowed_origin in settings.cors_origins_list:
        if origin == allowed_origin:
            return
    logger.warning("Origin rejected (origin=%s, path=%s)", origin, request.url.path)
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Origin not allowed"
    )
