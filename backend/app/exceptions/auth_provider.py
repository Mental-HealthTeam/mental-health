class InvalidCredentialsError(Exception):
    pass


class BaseSecurityError(Exception):
    def __init__(self, message: str = "A security error occurred.") -> None:
        super().__init__(message)


class TokenExpiredError(BaseSecurityError):
    def __init__(self, message: str = "Token has expired.") -> None:
        super().__init__(message)


class InvalidTokenError(BaseSecurityError):
    def __init__(self, message: str = "Invalid token.") -> None:
        super().__init__(message)
