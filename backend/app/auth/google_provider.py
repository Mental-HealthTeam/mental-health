import asyncio
import logging

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from auth.provider_interface import AuthProviderInterface
from exceptions.auth_provider import InvalidCredentialsError
from pydantic import ValidationError
from schemas.auth import ExternalIdentity
from database.models.models import AuthProvider


GOOGLE_TRANSPORT = google_requests.Request()


logger = logging.getLogger(__name__)


class GoogleAuthProvider(AuthProviderInterface):
    def __init__(self, client_id):
        self.CLIENT_ID = client_id

    async def authenticate(self, credentials: dict) -> ExternalIdentity:
        token = credentials.get("credential") if credentials else None
        if not token:
            raise InvalidCredentialsError("Missing credential")
        try:
            user_info = await asyncio.to_thread(
                id_token.verify_oauth2_token,
                token,
                GOOGLE_TRANSPORT,
                self.CLIENT_ID
            )
        except ValueError as e:
            logger.warning("Google token verification failed")
            raise InvalidCredentialsError("Invalid Google token") from e
        try:
            if user_info.get("email_verified") is not True:
                raise InvalidCredentialsError("Email is not verified")
            sub, email = user_info["sub"], user_info["email"]
            name = user_info.get("name")
            avatar_url = user_info.get("picture")
        except KeyError as e:
            raise InvalidCredentialsError("Token has no sub or email") from e
        try:
            return ExternalIdentity(
                provider=AuthProvider.GOOGLE,
                subject=sub,
                email=email,
                email_verified=True,
                name=name,
                avatar_url=avatar_url
            )
        except ValidationError as e:
            raise InvalidCredentialsError("Invalid token payload") from e
