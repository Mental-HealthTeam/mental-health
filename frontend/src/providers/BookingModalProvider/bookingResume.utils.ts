import type { Booking } from '../../types/booking'

export const canContinuePayment = (booking: Booking): boolean => {
    const expiresAt = booking.hold_expires_at ? Date.parse(booking.hold_expires_at) : NaN

    return (
        booking.status === 'pending' &&
        booking.payment_status === 'unpaid' &&
        Number.isFinite(expiresAt) &&
        expiresAt > Date.now()
    )
}
