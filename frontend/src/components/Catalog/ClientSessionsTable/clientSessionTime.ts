import type { SessionBooking } from '../../../types/session'
import { formatDate, formatTime } from '../../../utils/date'

export const JOIN_BEFORE_START_MS = 10 * 60_000

const SESSION_DURATION_MS = 50 * 60_000

export const getMeetingUrl = (value: string | null): string | null => {
    if (!value) return null

    try {
        const url = new URL(value)
        return url.protocol === 'https:' ? url.href : null
    } catch {
        return null
    }
}

export const getJoinUrl = (session: SessionBooking, now: number): string | null => {
    const startsAt = Date.parse(session.selected_time)

    if (
        session.status !== 'confirmed' ||
        !Number.isFinite(startsAt) ||
        now < startsAt - JOIN_BEFORE_START_MS ||
        now >= startsAt + SESSION_DURATION_MS
    ) {
        return null
    }

    return getMeetingUrl(session.meet_link)
}

export const formatSessionDateTime = (
    selectedTime: string | undefined,
    language: string,
): { date: string; time: string } => {
    if (!selectedTime || !Number.isFinite(Date.parse(selectedTime))) {
        return { date: '—', time: '—' }
    }

    return {
        date: formatDate(selectedTime, language),
        time: formatTime(selectedTime, language),
    }
}
