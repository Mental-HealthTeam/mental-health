import { useTranslation } from 'react-i18next'

import { useBookingModal } from '../../../providers/BookingModalProvider'
import { OutlineButton } from '../../UI/Buttons'

type Props = {
    psychologistId: string
}

export const PendingBookingButton = ({ psychologistId }: Props) => {
    const { t } = useTranslation('specialistProfile')
    const { pendingBookings, openPendingBookingModal } = useBookingModal()

    const bookings = pendingBookings.filter(
        (item) => item.psychologist.psychologist_id === psychologistId,
    )

    if (bookings.length === 0) {
        return null
    }

    return (
        <OutlineButton variant="secondary" onClick={() => openPendingBookingModal(bookings)}>
            {t('pendingBooking.button')}
        </OutlineButton>
    )
}
