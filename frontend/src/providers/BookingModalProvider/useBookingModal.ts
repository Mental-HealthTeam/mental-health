import { useContext } from 'react'

import { BookingModalContext } from './booking-modal-context'

export const useBookingModal = () => {
    const context = useContext(BookingModalContext)

    if (!context) {
        throw new Error('useBookingModal must be used within BookingModalProvider')
    }

    return context
}
