import type { Slot, SpecialistProfile } from '../../../types/specialist'

export type BookingSpecialistData = Pick<
    SpecialistProfile,
    'psychologist_id' | 'full_name' | 'avatar_url' | 'session_minutes' | 'price_per_hour'
>

export type BookingSlotsModalProps = {
    open: boolean
    specialist: BookingSpecialistData
    slots: Slot[]
    initialSelectedTime?: string
    onClose: () => void
    onCheckoutReady: (checkoutUrl: string) => void
    onContinue?: (selectedTime: string) => void
    timeZone?: string
    aiSessionId?: string
}

export type SlotGroup = {
    key: string
    date: Date
    times: string[]
}
