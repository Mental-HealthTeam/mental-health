const cancellationErrors = {
    BOOKING_NOT_FOUND: {
        messageKey: 'modal.bookingNotFound',
        retryBlocked: true,
    },
    BOOKING_CANNOT_BE_CANCELLED: {
        messageKey: 'modal.bookingCannotBeCancelled',
        retryBlocked: true,
    },
    CANCEL_PAYMENT_IN_PROGRESS: {
        messageKey: 'modal.paymentInProgress',
        retryBlocked: false,
    },
    CANCEL_SESSION_STARTED: {
        messageKey: 'modal.alreadyStarted',
        retryBlocked: true,
    },
    REFUND_NOT_AUTOMATIC: {
        messageKey: 'modal.refundNotAutomatic',
        retryBlocked: true,
    },
    BOOKING_CANCEL_FAILED: {
        messageKey: 'modal.cancelError',
        retryBlocked: false,
    },
    REFUND_FAILED: {
        messageKey: 'modal.refundFailed',
        retryBlocked: true,
    },
    PAYMENT_PROVIDER_UNAVAILABLE: {
        messageKey: 'modal.paymentProviderUnavailable',
        retryBlocked: false,
    },
} as const

type BookingCancellationErrorCode = keyof typeof cancellationErrors

export type BookingCancellationErrorKey =
    (typeof cancellationErrors)[BookingCancellationErrorCode]['messageKey']

type BookingCancellationResolution =
    | { action: 'confirmNoRefund' }
    | {
          action: 'showError'
          messageKey: BookingCancellationErrorKey
          retryBlocked: boolean
      }

export class ApiErrorResolver {
    static forBookingCancellation(error: unknown): BookingCancellationResolution {
        const code = this.getCode(error)

        if (code === 'CANCEL_NO_REFUND_CONFIRM_REQUIRED') {
            return { action: 'confirmNoRefund' }
        }

        if (code !== undefined && Object.hasOwn(cancellationErrors, code)) {
            return {
                action: 'showError',
                ...cancellationErrors[code as BookingCancellationErrorCode],
            }
        }

        return {
            action: 'showError',
            messageKey: 'modal.cancelError',
            retryBlocked: false,
        }
    }

    private static getCode(error: unknown): string | undefined {
        if (typeof error !== 'object' || error === null || !('data' in error)) {
            return undefined
        }

        const { data } = error

        if (typeof data !== 'object' || data === null || !('code' in data)) {
            return undefined
        }

        return typeof data.code === 'string' ? data.code : undefined
    }
}
