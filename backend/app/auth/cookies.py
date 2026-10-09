from typing import Annotated

from fastapi import Depends, Response
from schemas.auth import TokenPair
from config.settings import BaseAppSettings
from config.dependencies import get_settings


def set_auth_cookies(
        response: Response,
        tokens: TokenPair,
        settings: Annotated[BaseAppSettings, Depends(get_settings)]
):
    response.set_cookie(
        key=settings.ACCESS_COOKIE,
        value=tokens.access_token,
        max_age=settings.ACCESS_TTL_MIN * 60,
        path=settings.ACCESS_PATH,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax"
    )
    response.set_cookie(
        key=settings.REFRESH_COOKIE,
        value=tokens.refresh_token,
        max_age=settings.refresh_ttl_min * 60,
        path=settings.REFRESH_PATH,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax"
    )


def clear_auth_cookies(
        response: Response,
        settings: Annotated[BaseAppSettings, Depends(get_settings)]
):
    response.delete_cookie(
        key=settings.ACCESS_COOKIE,
        path=settings.ACCESS_PATH,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax"
    )
    response.delete_cookie(
        key=settings.REFRESH_COOKIE,
        path=settings.REFRESH_PATH,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax"
    )
