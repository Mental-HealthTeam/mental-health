# Booking and payment contract

This document is the agreement between the booking module (routes and
service in `backend/app/routes/bookings.py`,
`backend/app/services/booking_service.py`) and the modules that use it
(payments, Celery tasks, admin actions). Signatures and behaviour described in
the service docstrings must not change without agreement.

## Rules

- The client is always taken from the access token, never from the request.
- The price comes from the psychologist profile, never from the request.
- A booking changes state only through the service functions below.
- Errors are raised as `HTTPException` inside the service. Functions called by
  Celery tasks have no HTTP context and return values instead.
- Booking code never imports anything from `payment_provider`
  (except `PaymentProviderName` for typing).
- Migrations are created one at a time, one author at a time.
- Settings: `BOOKING_HOLD_MINUTES` (20), `BOOKING_HORIZON_DAYS` (30),
  `SESSION_DURATION_MIN` (60).

## States

| Event | `status` | `payment_status` | Service function |
|---|---|---|---|
| Booking created, slot reserved | `PENDING` | `UNPAID` | `create_booking` |
| Payment confirmed | `CONFIRMED` | `HELD` | `mark_paid` |
| Payment failed or hold expired | `CANCELLED` | `UNPAID` | `mark_payment_failed`, `expire_pending_bookings` |
| Session is over | `COMPLETED` | `HELD` | `mark_completed` |
| Complaint received | `DISPUTED` | `HELD` | `mark_disputed` |
| Payout done | `COMPLETED` | `PAID` | `mark_paid_out` |
| Cancelled and refunded | `CANCELLED` | `REFUNDED` | `mark_cancelled(refunded=True)` |

`HELD` means the money is on the platform account. `PAID` means it has been
paid out to the psychologist.

## HTTP endpoints (all under `/api/bookings`)

| Method and path | Handler | Request body | Response | Success |
|---|---|---|---|---|
| `POST ""` | `create_booking_endpoint` | `BookingCreateRequest` | `BookingResponse` | 201 |
| `GET ""` | `list_my_bookings` | query: `status`, `limit`, `offset` | `BookingListResponse` | 200 |
| `GET "/{booking_id}"` | `get_booking_endpoint` | none | `BookingResponse` | 200 |
| `POST "/{booking_id}/cancel"` | `cancel_booking_endpoint` | none | `BookingResponse` | 200 |
| `POST "/{booking_id}/dispute"` (admin) | `dispute_booking_endpoint` | `DisputeRequest` | `BookingResponse` | 200 |
| `POST "/{booking_id}/resolve-dispute"` (admin) | `resolve_dispute_endpoint` | `ResolveDisputeRequest` | `BookingResponse` | 200 |

Errors: 401 not authenticated, 403 not enough permissions, 404 booking not
found (also used for foreign bookings), 409 wrong state, 422 invalid data,
503 the time slot is already taken.

The cancel endpoint is completed by the payments module: a paid booking is
refunded before `mark_cancelled` is called, unless the session starts in less
than `BOOKING_FREE_CANCEL_HOURS` (planned setting, 24): then there is no refund,
`mark_cancelled` is not used and the booking is paid out as a completed session.

## Service functions and who calls them

| Function | Called by |
|---|---|
| `create_booking`, `get_booking_for_user`, `list_bookings_for_user` | booking routes |
| `find_booking_by_payment`, `mark_paid`, `mark_payment_failed` | payment webhook |
| `mark_cancelled` | booking cancellation, admin actions, refund webhook |
| `mark_disputed`, `resolve_dispute` | admin routes |
| `mark_paid_out`, `mark_completed`, `list_ready_for_payout` | automatic payout task |
| `expire_pending_bookings` | task that releases expired holds |

## Idempotency

`mark_paid`, `mark_payment_failed`, `mark_cancelled`, `mark_completed` and
`mark_paid_out` can be called twice with the same input: the second call
changes nothing and returns the booking. Payment providers repeat webhooks,
so this is required.

## Payouts

- Psychologists work as sole proprietors (FOP). The payout goes to the FOP
  settlement account (IBAN, tax number and account name). The provider gets
  them as `PayoutRequest.recipient`.
- The payout is made once a month for all completed bookings of one psychologist
  (a batch). `PayoutRequest.reference` is the idempotency key of the batch, for
  example `payout_<psychologist_id>_<YYYY-MM>`; the provider rejects a second
  payout with the same reference. After a successful payout `mark_paid_out` is
  called for every booking of the batch with the same `payout_reference`.
- The platform fee is a percentage setting (`PLATFORM_FEE_PERCENT`, planned) and
  is stored per booking in `platform_fee`.
- Payout details are stored in `psychologists` (`iban`, `tax_id`,
  `account_name`, all required) and are never returned by public endpoints or
  written to logs.

## Open points

- There are no columns for the dispute note and the admin who set it: both are
  written to the log for now.
- The form where a psychologist enters the payout details (in the
  psychologist's cabinet) is not built yet.
