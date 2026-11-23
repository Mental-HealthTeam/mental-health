import { useTranslation } from 'react-i18next'
import type { BookingSpecialistData } from '../bookingSlots.types.ts'
import { Avatar } from '../../../UI/Avatar'
import './BookingSpecialist.scss'

type Props = {
    specialist: BookingSpecialistData
    language: string
}

export const BookingSpecialist = ({ specialist, language }: Props) => {
    const { t } = useTranslation('specialistProfile')

    const formattedPrice = new Intl.NumberFormat(language, {
        maximumFractionDigits: 2,
    }).format(Number(specialist.price_per_hour))

    return (
        <div className="booking-slots-modal__specialist">
            <Avatar
                src={specialist.avatar_url ?? undefined}
                alt=""
                size="medium"
                className="booking-slots-modal__avatar"
            />

            <div>
                <h3>{specialist.full_name}</h3>

                <p>
                    {t('bookingModal.session', {
                        count: specialist.session_minutes,
                        price: formattedPrice,
                    })}
                </p>
            </div>
        </div>
    )
}
