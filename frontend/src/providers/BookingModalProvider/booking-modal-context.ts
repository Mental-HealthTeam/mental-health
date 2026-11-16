import { createContext } from 'react'

import type { Slot, SpecialistProfile } from '../../types/specialist'

export type BookingSpecialist = Pick<
    SpecialistProfile,
    'psychologist_id' | 'full_name' | 'avatar_url' | 'session_minutes' | 'price_per_hour'
>

export type BookingSelection = {
    specialist: BookingSpecialist
    selectedTime: string
}

export type OpenBookingModalOptions = {
    specialist: BookingSpecialist
    slots: Slot[]
    timeZone?: string
    onContinue: (selection: BookingSelection) => void
}

type BookingModalContextValue = {
    openBookingModal: (options: OpenBookingModalOptions) => void
    closeBookingModal: () => void
}

export const BookingModalContext = createContext<BookingModalContextValue | null>(null)
