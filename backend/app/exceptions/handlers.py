import logging

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import JSONResponse

from exceptions.base import AppError


logger = logging.getLogger(__name__)


DEFAULT_CODES = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    409: "CONFLICT",
    413: "PAYLOAD_TOO_LARGE",
    422: "UNPROCESSABLE_ENTITY",
    429: "TOO_MANY_REQUESTS",
    500: "INTERNAL_ERROR",
    502: "BAD_GATEWAY",
    503: "SERVICE_UNAVAILABLE",
}


REASONS = {
    "missing": "required",
    "string_too_short": "too_short",
    "string_too_long": "too_long",
    "too_short": "too_short",
    "too_long": "too_long",
    "string_pattern_mismatch": "invalid_format",
    "datetime_parsing": "invalid_format",
    "datetime_from_date_parsing": "invalid_format",
    "date_parsing": "invalid_format",
    "date_from_datetime_parsing": "invalid_format",
    "time_parsing": "invalid_format",
    "uuid_parsing": "invalid_format",
    "decimal_parsing": "invalid_format",
    "int_parsing": "invalid_format",
    "float_parsing": "invalid_format",
    "bool_parsing": "invalid_format",
    "json_invalid": "invalid_format",
    "url_parsing": "invalid_format",
    "greater_than": "invalid_value",
    "greater_than_equal": "invalid_value",
    "less_than": "invalid_value",
    "less_than_equal": "invalid_value",
    "enum": "invalid_value",
    "literal_error": "invalid_value",
}


async def app_error_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.code, "detail": exc.detail, **exc.extra}
    )


async def http_error_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": DEFAULT_CODES.get(exc.status_code, "ERROR"),
            "detail": str(exc.detail)
        },
        headers=exc.headers
    )


async def validation_error_handler(request, exc):
    errors = [
        {
            "field": ".".join(str(p) for p in error["loc"][1:]),
            "reason": REASONS.get(error["type"], "invalid_value")
        }
        for error in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={
            "code": "VALIDATION_ERROR",
            "detail": "Invalid request data.",
            "errors": errors
        }
    )


async def unhandled_error_handler(request, exc):
    logger.warning(
        "Unhandled error on %s %s",
        request.method, request.url.path
    )
    return JSONResponse(
        status_code=500,
        content={
            "code": "INTERNAL_ERROR",
            "detail": "Internal server error."
        }
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(Exception, unhandled_error_handler)
