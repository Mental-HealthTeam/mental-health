import type { AvailableSlot, SessionBooking, SessionItem, SessionStatus } from '../types/session'

const SESSION_DURATION_MS = 60 * 60 * 1000

export const isBooking = (item: SessionItem): item is SessionBooking => {
    if ('booking_id' in item) {
        return true
    }

    return false
}

export const isSlot = (item: SessionItem): item is AvailableSlot => {
    if ('slot_id' in item) {
        return true
    }

    return false
}

export const getSessionStatus = (item: SessionItem): SessionStatus => {
    if (isSlot(item)) return 'available'
    if (item.status === 'completed') return 'completed'

    const endsAt = new Date(item.selected_time).getTime() + SESSION_DURATION_MS

    return endsAt < Date.now() ? 'completed' : 'scheduled'
}

export const isVisibleSession = (item: SessionItem): boolean =>
    !isBooking(item) || item.status === 'confirmed' || item.status === 'completed'

export const getSessionKey = (item: SessionItem): string => {
    if (isBooking(item)) {
        return item.booking_id
    }

    return item.slot_id
}
