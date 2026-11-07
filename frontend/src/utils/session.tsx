import type { AvailableSlot, SessionBooking, SessionItem, SessionStatus } from '../types/session'

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
    if (isSlot(item)) {
        return 'available'
    }

    if (item.status === 'completed') {
        return 'completed'
    }

    return 'scheduled'
}

export const isVisibleSession = (item: SessionItem): boolean =>
    !isBooking(item) || item.status === 'confirmed' || item.status === 'completed'

export const getSessionKey = (item: SessionItem): string => {
    if (isBooking(item)) {
        return item.booking_id
    }

    return item.slot_id
}
