const EXPIRED_CHECKOUT_ERRORS = new Set([
    'BOOKING_HOLD_EXPIRED',
    'BOOKING_HOLD_EXPIRING_SOON',
    'BOOKING_HOLD_MISSING',
])

export const isExpiredCheckoutError = (error: unknown): boolean => {
    if (typeof error !== 'object' || error === null) {
        return false
    }

    if (!('status' in error) || error.status !== 409) {
        return false
    }

    if (!('data' in error)) {
        return false
    }

    const data = error.data

    if (typeof data !== 'object' || data === null || !('code' in data)) {
        return false
    }

    return typeof data.code === 'string' && EXPIRED_CHECKOUT_ERRORS.has(data.code)
}
