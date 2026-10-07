from typing import Annotated
from fastapi import Depends

from config.settings import BaseAppSettings
from auth.google_provider import GoogleAuthProvider
from config.dependencies import get_settings


def get_google_provider(
    settings: Annotated[BaseAppSettings, Depends(get_settings)]
):
    return GoogleAuthProvider(
        client_id=settings.GOOGLE_CLIENT_ID
    )
