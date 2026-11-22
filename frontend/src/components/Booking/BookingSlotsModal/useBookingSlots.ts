import { useEffect, useMemo, useState } from 'react'

import type { Slot } from '../../../types/specialist'
import type { SlotGroup } from './bookingSlots.types'

type Props = {
    open: boolean
    slots: Slot[]
    language: string
    timeZone: string
}

export const useBookingSlots = ({ open, slots, language, timeZone }: Props) => {
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        if (!open) {
            return
        }

        const frame = window.requestAnimationFrame(() => {
            setNow(Date.now())
        })

        const timer = window.setInterval(() => {
            setNow(Date.now())
        }, 1000)

        return () => {
            window.cancelAnimationFrame(frame)
            window.clearInterval(timer)
        }
    }, [open])

    const formatters = useMemo(
        () => ({
            day: new Intl.DateTimeFormat('en-CA', {
                timeZone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }),

            date: new Intl.DateTimeFormat(language, {
                timeZone,
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }),

            time: new Intl.DateTimeFormat(language, {
                timeZone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            }),

            selectedDate: new Intl.DateTimeFormat(language, {
                timeZone,
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            }),
        }),
        [language, timeZone],
    )

    const availableSlots = useMemo(
        () =>
            [...new Set(slots.map((slot) => slot.time))]
                .map((time) => ({
                    time,
                    date: new Date(time),
                }))
                .filter(({ date }) => Number.isFinite(date.getTime()) && date.getTime() > now)
                .sort((first, second) => first.date.getTime() - second.date.getTime()),
        [slots, now],
    )

    const groups = useMemo(() => {
        const grouped = new Map<string, SlotGroup>()

        availableSlots.forEach(({ time, date }) => {
            const key = formatters.day.format(date)
            const group = grouped.get(key)

            if (group) {
                group.times.push(time)
            } else {
                grouped.set(key, {
                    key,
                    date,
                    times: [time],
                })
            }
        })

        return [...grouped.values()]
    }, [availableSlots, formatters])

    return {
        availableSlots,
        groups,
        dateFormatter: formatters.date,
        timeFormatter: formatters.time,
        selectedDateFormatter: formatters.selectedDate,
    }
}
