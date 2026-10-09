import logging
from typing import Annotated
from fastapi import (
    APIRouter,
    status,
    Depends,
    HTTPException,
    Response,
    Request
)

from database import get_db
from config.settings import BaseAppSettings
from schemas.auth import UserPublic
from database.models.models import User
from config.dependencies import get_settings, get_jwt_manager
from auth.token_interface import JWTAuthManagerInterface
from sqlalchemy.ext.asyncio import AsyncSession
from auth.dependencies import (
    get_current_user,
    get_client_info,
    get_refresh_token
)
from auth.dependencies import get_google_provider
from auth.provider_interface import AuthProviderInterface
from schemas.auth import (
    ClientInfo,
    GoogleLoginRequest,
    SessionCreateData,
    SessionRotateData,
    RevokeSessionSchema,
    RevokeAllSchema
)
from exceptions.auth_provider import InvalidCredentialsError
from services.auth_service import get_or_create_user
from services.auth_session_service import (
    create_session,
    rotate_session,
    revoke_session,
    revoke_all_sessions
)
from auth.cookies import (
    set_auth_cookies,
    clear_auth_cookies
)


router = APIRouter()

logger = logging.getLogger(__name__)


@router.post(
    "/google",
    status_code=status.HTTP_200_OK,
    response_model=UserPublic
)
async def google_login(
        response: Response,
        db: Annotated[AsyncSession, Depends(get_db)],
        settings: Annotated[BaseAppSettings, Depends(get_settings)],
        jwt_manager: Annotated[JWTAuthManagerInterface, Depends(get_jwt_manager)],
        provider: Annotated[AuthProviderInterface, Depends(get_google_provider)],
        client: Annotated[ClientInfo, Depends(get_client_info)],
        login_data: GoogleLoginRequest
):
    try:
        identity = await provider.authenticate(login_data.model_dump())
    except InvalidCredentialsError as e:
        logger.warning("Google login rejected: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        ) from e
    user = await get_or_create_user(db=db, identity=identity)
    session_create_data = SessionCreateData(
        user_agent=client.user_agent,
        ip=client.ip,
        user_id=user.id
    )
    session_tokens = await create_session(
        db=db,
        jwt_manager=jwt_manager,
        settings=settings,
        data=session_create_data
    )
    set_auth_cookies(
        response=response,
        tokens=session_tokens,
        settings=settings
    )
    logger.info(
        "User logged in (user_id=%s, provider=%s)",
        user.id, identity.provider.value
    )

    return user


@router.get(
    "/me",
    status_code=status.HTTP_200_OK,
    response_model=UserPublic
)
async def get_me(
        current_user: Annotated[User, Depends(get_current_user)]
):
    return current_user


@router.post(
    "/refresh",
    status_code=status.HTTP_204_NO_CONTENT
)
async def refresh(
        response: Response,
        db: Annotated[AsyncSession, Depends(get_db)],
        settings: Annotated[BaseAppSettings, Depends(get_settings)],
        jwt_manager: Annotated[JWTAuthManagerInterface, Depends(get_jwt_manager)],
        client: Annotated[ClientInfo, Depends(get_client_info)],
        refresh_token: Annotated[str, Depends(get_refresh_token)]
):
    session_rotate_data = SessionRotateData(
        user_agent=client.user_agent,
        ip=client.ip,
        refresh_token=refresh_token
    )
    session_tokens = await rotate_session(
        db=db,
        jwt_manager=jwt_manager,
        settings=settings,
        data=session_rotate_data
    )
    set_auth_cookies(
        response=response,
        tokens=session_tokens,
        settings=settings
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT
)
async def log_out_session(
        response: Response,
        request: Request,
        db: Annotated[AsyncSession, Depends(get_db)],
        settings: Annotated[BaseAppSettings, Depends(get_settings)],
        jwt_manager: Annotated[JWTAuthManagerInterface, Depends(get_jwt_manager)]
):
    refresh_token = request.cookies.get(settings.REFRESH_COOKIE)
    if refresh_token:
        revoke_session_data = RevokeSessionSchema(
            refresh_token=refresh_token
        )
        await revoke_session(
            db=db,
            jwt_manager=jwt_manager,
            data=revoke_session_data
        )
    else:
        logger.debug("Logout: no refresh cookie, only clearing cookies")
    clear_auth_cookies(
        response=response,
        settings=settings
    )


@router.post(
    "/logout-all",
    status_code=status.HTTP_204_NO_CONTENT
)
async def log_out_all_sessions(
        response: Response,
        db: Annotated[AsyncSession, Depends(get_db)],
        settings: Annotated[BaseAppSettings, Depends(get_settings)],
        jwt_manager: Annotated[JWTAuthManagerInterface, Depends(get_jwt_manager)],
        refresh_token: Annotated[str, Depends(get_refresh_token)]
):
    revoke_session_data = RevokeAllSchema(
        refresh_token=refresh_token
    )
    await revoke_all_sessions(
        db=db,
        jwt_manager=jwt_manager,
        data=revoke_session_data
    )
    clear_auth_cookies(
        response=response,
        settings=settings
    )
