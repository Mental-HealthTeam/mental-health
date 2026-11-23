import { useTranslation } from 'react-i18next'

import type { BookingRetryInfo } from '../../../types/bookingsApi'

import { Avatar } from '../../UI/Avatar'
import { TimeSlot } from '../../UI/TimeSlot'

import './PaymentCancelBookingCard.scss'

type Props = {
    booking: BookingRetryInfo
    expired: boolean
}

const isSameDay = (first: Date, second: Date) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()

export const PaymentCancelBookingCard = ({ booking, expired }: Props) => {
    const { t, i18n } = useTranslation(['psychologists', 'success'])

    const language = i18n.resolvedLanguage ?? i18n.language ?? 'uk'

    const { psychologist, selected_time: selectedTime } = booking

    const sessionDate = new Date(selectedTime)
    const hasValidDate = Number.isFinite(sessionDate.getTime())

    const today = new Date()
    const tomorrow = new Date(today)

    tomorrow.setDate(today.getDate() + 1)

    let slotLabel = ''

    if (hasValidDate) {
        const formattedTime = new Intl.DateTimeFormat(language, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(sessionDate)

        const formattedDate = new Intl.DateTimeFormat(language, {
            day: '2-digit',
            month: '2-digit',
        }).format(sessionDate)

        if (isSameDay(sessionDate, today)) {
            slotLabel = `${t('psychologists:card.today')} ${formattedTime}`
        } else if (isSameDay(sessionDate, tomorrow)) {
            slotLabel = `${t('psychologists:card.tomorrow')} ${formattedTime}`
        } else {
            slotLabel = `${formattedDate} ${formattedTime}`
        }
    }

    return (
        <article className="payment-cancel-booking-card">
            <header className="payment-cancel-booking-card__header">
                <Avatar
                    src={psychologist.avatar_url ?? undefined}
                    alt=""
                    size="large"
                    className="payment-cancel-booking-card__avatar"
                />

                <div className="payment-cancel-booking-card__identity">
                    <h2 className="payment-cancel-booking-card__name">{psychologist.full_name}</h2>

                    {psychologist.is_verified && (
                        <span className="payment-cancel-booking-card__verified">
                            {t('psychologists:card.verified')}
                        </span>
                    )}
                </div>
            </header>

            <div className="payment-cancel-booking-card__session">
                <p className="payment-cancel-booking-card__session-title">
                    {t('success:card.bookedTime')}
                </p>

                {hasValidDate && (
                    <TimeSlot
                        label={slotLabel}
                        status={expired ? 'expired' : 'active'}
                        className="payment-cancel-booking-card__time"
                    />
                )}
            </div>
        </article>
    )
}
