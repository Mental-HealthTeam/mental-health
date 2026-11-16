import type { Booking } from '../../types/booking'

const STORAGE_KEY = 'mental-health:pending-booking-id'

export const readPendingBookingId = (): string | null => {
    try {
        return sessionStorage.getItem(STORAGE_KEY)
    } catch {
        return null
    }
}

export const removePendingBookingId = (bookingId: string) => {
    try {
        if (sessionStorage.getItem(STORAGE_KEY) === bookingId) {
            sessionStorage.removeItem(STORAGE_KEY)
        }
    } catch {
        // Storage may be unavailable; Redux continues to work.
    }
}

export const canContinuePayment = (booking: Booking): boolean => {
    const expiresAt = booking.hold_expires_at ? Date.parse(booking.hold_expires_at) : NaN

    return (
        booking.status === 'pending' &&
        booking.payment_status === 'unpaid' &&
        Number.isFinite(expiresAt) &&
        expiresAt > Date.now()
    )
}
