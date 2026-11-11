# Error responses

Every error response is JSON with a stable `code` and an English `detail` meant for developers and logs.
The HTTP status is unchanged; only the body is unified. Translate by `code` on the client.

```json
{"code": "SLOT_ALREADY_BOOKED", "detail": "The time slot is already taken.", "nearest_available_slot": "2026-11-04T14:00:00+02:00"}
```

Some errors carry extra fields next to `code` and `detail` (see the table below).

## Validation errors (422)

Request validation errors use `code: "VALIDATION_ERROR"` and add an `errors` list. `errors` exists only here.

```json
{
  "code": "VALIDATION_ERROR",
  "detail": "Invalid request data.",
  "errors": [
    {"field": "phone", "reason": "too_short"},
    {"field": "matching_info.symptom_codes.0", "reason": "invalid_format"}
  ]
}
```

- `field` is the path in the request body or query (list items use the index). An empty string means a model-level error.
- `reason` is one of `required`, `too_short`, `too_long`, `invalid_format`, `invalid_value`. The mapping from Pydantic error types is in `handlers.py` (`REASONS`).

## Fallback

If a `code` is unknown to the client, show a generic message by HTTP status (400/422, 401, 403, 404, 409, 5xx) and do not show `detail` to the user.
Errors raised by the framework (unknown URL, wrong method) and plain `HTTPException`s get a default code by status: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `METHOD_NOT_ALLOWED`, `CONFLICT`, `PAYLOAD_TOO_LARGE`, `UNPROCESSABLE_ENTITY`, `TOO_MANY_REQUESTS`, `INTERNAL_ERROR`, `BAD_GATEWAY`, `SERVICE_UNAVAILABLE`; any other status gets `ERROR`.
Unexpected exceptions return 500 with `INTERNAL_ERROR` and are logged with the traceback.

## Raising an error

```python
from exceptions.base import AppError

raise AppError(
    status.HTTP_409_CONFLICT,
    "SLOT_ALREADY_BOOKED",
    "The time slot is already taken.",
    nearest_available_slot=nearest_available_slot,  # extra fields go to the body
)
```

- Keep `raise ... from e` when re-raising inside `except`.
- Extra values must be JSON-serializable (convert `datetime`/`UUID` to strings first).
- Catch it with `except AppError`, not `except HTTPException`.
- Register new codes in the table below and tell the frontend.

Handlers live in `handlers.py` and are registered in `main.py` via `register_exception_handlers(app)`.

## Error codes

| Code | HTTP | Detail | Extra fields | Raised in |
|---|---|---|---|---|
| `AVATAR_DIMENSIONS_TOO_LARGE` | 400 | Image dimensions are too large. | - | avatar_storage.py |
| `AVATAR_EMPTY` | 400 | Avatar file is empty. | - | avatar_storage.py |
| `AVATAR_INVALID_IMAGE` | 400 | Invalid or unsupported image. | - | avatar_storage.py |
| `AVATAR_UNSUPPORTED_FORMAT` | 400 | Only JPEG, PNG, and WebP images are supported. | - | avatar_storage.py |
| `INVALID_WEBHOOK` | 400 | Invalid webhook. | - | payment_service.py |
| `MATCHING_INFO_REQUIRED` | 400 | matching_info is required | - | matching_service.py |
| `INVALID_CREDENTIALS` | 401 | Invalid credentials | - | auth.py, auth_session_service.py |
| `INVALID_TOKEN` | 401 | Invalid token. | - | auth_session_service.py |
| `NOT_AUTHENTICATED` | 401 | Not authenticated | - | dependencies.py |
| `BOOKINGS_VIEW_FORBIDDEN` | 403 | You do not have permission to view bookings. | - | booking_service.py |
| `MEETING_LINK_PSYCHOLOGIST_ONLY` | 403 | Only psychologists can update the meeting link. | - | users.py |
| `ORIGIN_NOT_ALLOWED` | 403 | Origin not allowed | - | dependencies.py |
| `PERMISSION_DENIED` | 403 | You do not have permission to perform this action. | - | dependencies.py |
| `BOOKING_NOT_FOUND` | 404 | Booking not found. | - | booking_service.py, payment_service.py |
| `PSYCHOLOGIST_NOT_FOUND` | 404 | Psychologist not found | - | psychologists.py |
| `PSYCHOLOGIST_PROFILE_NOT_FOUND` | 404 | Psychologist profile not found | - | psychologists.py, users.py |
| `RECORDING_SESSION_NOT_FOUND` | 404 | Session {session_id!r} not found! | - | redis_storage.py |
| `WEBHOOK_PROVIDER_NOT_ACTIVE` | 404 | Webhook provider is not active. | - | payments.py |
| `BOOKING_CANNOT_BE_CANCELLED` | 409 | Booking cannot be cancelled in its current state. | - | booking_service.py |
| `BOOKING_CANNOT_BE_PAID` | 409 | Booking cannot be paid in its current state. | - | payment_service.py |
| `BOOKING_HOLD_EXPIRED` | 409 | Booking hold has expired. | - | booking_service.py, payment_service.py |
| `BOOKING_HOLD_EXPIRING_SOON` | 409 | The booking hold expires in less than 2 minutes. Create a new booking after it expires. | - | payment_service.py |
| `BOOKING_HOLD_MISSING` | 409 | Booking hold is missing, create a new booking. | - | payment_service.py |
| `BOOKING_NOT_DISPUTED` | 409 | Booking is not in a disputed state. | - | booking_service.py |
| `BOOKING_NOT_READY_FOR_PAYOUT` | 409 | Booking is not ready for payout. | - | booking_service.py |
| `BOOKING_WRONG_STATE` | 409 | Booking cannot be marked as paid in its current state. | - | booking_service.py |
| `CANCEL_NO_REFUND_CONFIRM_REQUIRED` | 409 | The session starts in less than {settings.BOOKING_FREE_CANCEL_HOURS} hours, the payment will not be refunded. Confirm to cancel. | `free_cancel_hours` | payment_service.py |
| `CANCEL_PAYMENT_IN_PROGRESS` | 409 | Payment for this booking is in progress. If you do not pay, it will be cancelled automatically when the hold expires. | - | payment_service.py |
| `CANCEL_SESSION_STARTED` | 409 | The session has already started, the booking cannot be cancelled. | - | payment_service.py |
| `IBAN_ALREADY_EXISTS` | 409 | This IBAN already belongs to another psychologist | - | psychologists.py |
| `PAYOUT_DETAILS_CONFLICT` | 409 | Payout details conflict with existing data | - | psychologists.py |
| `REFUND_NOT_AUTOMATIC` | 409 | The payment for this booking cannot be refunded automatically, contact support. | - | booking_service.py, payment_service.py |
| `SLOT_ALREADY_BOOKED` | 409 | The time slot is already taken. | `nearest_available_slot` | booking_service.py |
| `TAX_ID_ALREADY_EXISTS` | 409 | This tax ID already belongs to another psychologist | - | psychologists.py |
| `AVATAR_TOO_LARGE` | 413 | Avatar file is too large. | - | avatar_storage.py |
| `AI_SESSION_NOT_FOUND` | 422 | AI session not found for this user. | - | booking_service.py |
| `BOOKING_TIME_IN_PAST` | 422 | Selected time must be in the future. | - | booking_service.py |
| `BOOKING_TIME_TOO_FAR` | 422 | Selected time exceeds the booking horizon. | - | booking_service.py |
| `DISPUTE_INVALID_RESOLUTION` | 422 | A dispute can only be resolved as completed or cancelled. | - | booking_service.py |
| `INVALID_PRICE_RANGE` | 422 | price_from cannot be greater than price_to | - | psychologists.py |
| `PSYCHOLOGIST_NOT_AVAILABLE` | 422 | Psychologist not found or not active. | - | booking_service.py |
| `SLOT_NOT_AVAILABLE` | 422 | Selected time is not an available slot. | - | booking_service.py |
| `AVATAR_UPLOAD_FAILED` | 500 | Could not upload your avatar try later | - | avatar_storage.py, users.py |
| `BOOKING_CANCEL_FAILED` | 500 | Could not cancel the booking. | - | payment_service.py |
| `MATCHING_DATABASE_ERROR` | 500 | Database error while searching psychologists | - | matching_service.py |
| `PAYMENT_EVENT_SAVE_FAILED` | 500 | Could not save the payment event. | - | payment_service.py |
| `PAYMENT_SESSION_SAVE_FAILED` | 500 | Could not save the payment session. | - | payment_service.py |
| `REFUND_ERROR_SAVE_FAILED` | 500 | Could not save the refund error. | - | booking_service.py |
| `SESSION_REVOKE_FAILED` | 500 | Database error while revoking session | - | auth_session_service.py |
| `SIGN_IN_DATABASE_ERROR` | 500 | Database error while signing in | - | auth_service.py, auth_session_service.py |
| `PAYMENT_PROVIDER_ERROR` | 502 | Payment provider is unavailable, try again later. | - | payment_service.py |
| `REFUND_FAILED` | 502 | The refund failed, contact the payment provider. | - | booking_service.py, payment_service.py |
| `CONTACT_REQUEST_FAILED` | 503 | Unable to send contact request. | - | contact.py |
| `PAYMENT_PROVIDER_UNAVAILABLE` | 503 | Payment provider is not available | - | dependencies.py |

Note: when one code has several detail texts (for example `BOOKING_WRONG_STATE`, `AVATAR_TOO_LARGE`, `REFUND_NOT_AUTOMATIC`), the table shows the first; clients should rely on `code`, not on `detail`.
