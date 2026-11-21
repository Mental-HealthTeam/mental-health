export type BookingRetryInfo = {
    booking_id: string
    psychologist: {
        psychologist_id: string
        full_name: string
        title: string
        is_verified: boolean
        avatar_url: string | null
    }
    selected_time: string
    status: string
    payment_status: string
    price: string
    currency: string
    hold_expires_at: string | null
}
