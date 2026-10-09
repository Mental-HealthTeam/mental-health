from datetime import timedelta, datetime, timezone
from typing import Optional

import jwt
from auth.token_interface import JWTAuthManagerInterface
from jwt import ExpiredSignatureError, PyJWTError

from exceptions.auth_provider import TokenExpiredError, InvalidTokenError


class JWTAuthManager(JWTAuthManagerInterface):
    def __init__(
            self,
            secret_key_access: str,
            secret_key_refresh: str,
            algorithm: str,
            access_key_timedelta_minutes: int,
            refresh_key_timedelta_minutes: int
    ):
        self.secret_key_access = secret_key_access
        self.secret_key_refresh = secret_key_refresh
        self.algorithm = algorithm
        self.access_key_timedelta_minutes = access_key_timedelta_minutes
        self.refresh_key_timedelta_minutes = refresh_key_timedelta_minutes

    def _create_token(
            self,
            data: dict,
            algorithm: str,
            secret_key: str,
            expires_delta: Optional[timedelta] = None
    ) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(payload=to_encode, key=secret_key, algorithm=algorithm)

        return encoded_jwt

    def create_access_token(self, data, expires_delta: Optional[timedelta] = None) -> str:
        if not expires_delta:
            expires_delta = timedelta(minutes=self.access_key_timedelta_minutes)
        return self._create_token(
            data=data,
            algorithm=self.algorithm,
            secret_key=self.secret_key_access,
            expires_delta=expires_delta
        )

    def create_refresh_token(self, data, expires_delta: Optional[timedelta] = None) -> str:
        if not expires_delta:
            expires_delta = timedelta(minutes=self.refresh_key_timedelta_minutes)
        return self._create_token(
            data=data,
            algorithm=self.algorithm,
            secret_key=self.secret_key_refresh,
            expires_delta=expires_delta
        )

    def decode_access_token(self, token: str) -> dict:
        try:
            return jwt.decode(jwt=token, key=self.secret_key_access, algorithms=[self.algorithm])
        except ExpiredSignatureError as e:
            raise TokenExpiredError from e
        except PyJWTError as e:
            raise InvalidTokenError from e

    def decode_refresh_token(self, token: str) -> dict:
        try:
            return jwt.decode(jwt=token, key=self.secret_key_refresh, algorithms=[self.algorithm])
        except ExpiredSignatureError as e:
            raise TokenExpiredError from e
        except PyJWTError as e:
            raise InvalidTokenError from e

    def verify_access_token_or_raise(self, token: str) -> None:
        self.decode_access_token(token=token)

    def verify_refresh_token_or_raise(self, token: str) -> None:
        self.decode_refresh_token(token=token)
