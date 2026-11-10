export type Booking = {
    booking_id: string
    psychologist: {
        psychologist_id: string
        full_name: string
        title: string
        avatar_url: string | null
    }
    selected_time: string
    status: 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'completed' | 'disputed'
    payment_status: 'unpaid' | 'held' | 'paid' | 'refunded'
    price: string
    currency: string
    selection_source: string
    ai_session_id: string | null
    hold_expires_at: string | null
    meet_link: string | null
}
