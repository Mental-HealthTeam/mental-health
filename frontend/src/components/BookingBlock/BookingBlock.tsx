import { useTranslation } from 'react-i18next'
import { Button } from '../UI/Button'
import { useId, useState } from 'react'
import { TimeSlot } from '../UI/TimeSlot'

import './BookingBlock.scss'

type Props = {
    name: string
    slots: string[]
}

const isSameDay = (firstDate: Date, secondDate: Date) =>
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()

export const BookingBlock = ({ name, slots }: Props) => {
    const { t, i18n } = useTranslation(['psychologists', 'accessibility', 'specialistProfile'])
    const [isBooking, setIsBooking] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState('')
    const radioGroupId = useId()

    const formatTimeSlot = (time: string) => {
        const date = new Date(time)
        const today = new Date()
        const tomorrow = new Date(today)

        tomorrow.setDate(today.getDate() + 1)

        const formattedTime = new Intl.DateTimeFormat(i18n.language, {
            hour: '2-digit',
            minute: '2-digit',
        }).format(date)

        if (isSameDay(date, today)) {
            return `${t('psychologists:card.today')} ${formattedTime}`
        }

        if (isSameDay(date, tomorrow)) {
            return `${t('psychologists:card.tomorrow')} ${formattedTime}`
        }

        const formattedDate = new Intl.DateTimeFormat(i18n.language, {
            day: '2-digit',
            month: '2-digit',
        }).format(date)

        return `${formattedDate} ${formattedTime}`
    }

    return (
        <div className="booking-block">
            {!isBooking && (
                <Button
                    className="booking-block__booking-button"
                    variant="primary"
                    size="medium"
                    fullWidth
                    onClick={() => setIsBooking(true)}
                >
                    {t('psychologists:card.bookSession')}
                </Button>
            )}

            {isBooking && (
                <div className="booking-block__availability">
                    <span className="booking-block__availability-title">
                        {t('specialistProfile:card.availability')}
                    </span>

                    {slots && (
                        <div
                            className="booking-block__slots"
                            role="radiogroup"
                            aria-label={t('accessibility:specialistCard.availableTimes', {
                                name,
                            })}
                        >
                            {slots.map((slot) => {
                                console.log('slot:', slot)
                                return (
                                    <TimeSlot
                                        key={slot}
                                        label={formatTimeSlot(slot)}
                                        value={slot}
                                        name={`specialist-time-${radioGroupId}`}
                                        checked={selectedSlot === slot}
                                        onChange={setSelectedSlot}
                                    />
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
