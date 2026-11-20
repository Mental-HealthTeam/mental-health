export type BookingStatus =
    'pending' | 'confirmed' | 'declined' | 'cancelled' | 'completed' | 'disputed'

export type PaymentStatus = 'unpaid' | 'held' | 'paid' | 'refunded'

export type SessionStatus = 'scheduled' | 'completed' | 'available'

export type SessionPsychologist = {
    psychologist_id: string
    full_name: string
    title: string
    avatar_url: string | null
}

export type SessionClient = {
    id: string
    name: string | null
    avatar_url: string | null
}

export type SessionBooking = {
    booking_id: string
    selected_time: string
    status: BookingStatus
    payment_status: PaymentStatus
    price: string
    currency: string
    meet_link: string | null
    psychologist: SessionPsychologist
    client: SessionClient | null
}

export type SessionsResponse = {
    items: SessionBooking[]
    total: number
}

export type AvailableSlot = {
    slot_id: string
    selected_time: string
}

export type SessionItem = SessionBooking | AvailableSlot
