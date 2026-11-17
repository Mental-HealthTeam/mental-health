import { useTranslation } from 'react-i18next'

import type { Slot } from '../../../types/specialist.ts'
import type { BookingSpecialist } from '../../../providers/BookingModalProvider'
import { useBookingModal } from '../../../providers/BookingModalProvider'
import { PrimaryButton } from '../../UI/Buttons'

type Props = {
    specialist: BookingSpecialist
    slots: Slot[]
}

export const BookingModalButton = ({ specialist, slots }: Props) => {
    const { t } = useTranslation('psychologists')
    const { openBookingModal } = useBookingModal()

    return (
        <PrimaryButton
            onClick={() =>
                openBookingModal({
                    specialist,
                    slots: slots ?? [],
                })
            }
        >
            {t('card.bookSession')}
        </PrimaryButton>
    )
}
