import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '../UI/Avatar'
import { Button } from '../UI/Button'
import { TimeSlot } from '../UI/TimeSlot'

import './SpecialistCard.scss'
import type { SymptomCode } from '../../types/psychologist.ts'
import { OutlineButton } from '../UI/Buttons/index.ts'

type TimeSlotItem = {
    time: string
}

type Props = {
    id: string
    name: string
    avatar: string | null
    experience: number
    price: string
    methods: string[]
    topics: SymptomCode[]
    timeSlots: TimeSlotItem[]
}

const isSameDay = (firstDate: Date, secondDate: Date) =>
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()

export const SpecialistCard = ({
    id,
    name,
    avatar,
    experience,
    price,
    methods,
    topics,
    timeSlots,
}: Props) => {
    const { t, i18n } = useTranslation(['psychologists', 'symptoms', 'accessibility'])

    const radioGroupId = useId()

    const [isBooking, setIsBooking] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState('')

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
        <article className="specialist-card" aria-labelledby={`specialist-${id}-name`}>
            <header className="specialist-card__header">
                <Avatar
                    src={avatar ?? undefined}
                    alt=""
                    size="large"
                    className="specialist-card__avatar"
                />

                <div className="specialist-card__identity">
                    <h3 className="specialist-card__name" id={`specialist-${id}-name`}>
                        {name}
                    </h3>

                    <span className="specialist-card__verified">
                        {t('psychologists:card.verified')}
                    </span>
                </div>
            </header>

            <div className="specialist-card__meta">
                <div className="specialist-card__meta-row">
                    <span>{t('psychologists:card.experience')}</span>

                    <span className="specialist-card__dot" aria-hidden="true">
                        ·
                    </span>

                    <strong>
                        {t('psychologists:card.experienceYears', {
                            count: experience,
                        })}
                    </strong>
                </div>

                <div className="specialist-card__meta-row">
                    <span>{t('psychologists:card.sessionDuration')}</span>

                    <span className="specialist-card__dot" aria-hidden="true">
                        ·
                    </span>

                    <strong>
                        {t('psychologists:card.price', {
                            price: new Intl.NumberFormat('uk-UA', {
                                maximumFractionDigits: 0,
                            }).format(Number(price)),
                        })}
                    </strong>
                </div>
            </div>

            <section className="specialist-card__section">
                <span className="specialist-card__section-title">
                    {t('psychologists:card.therapeuticApproach')}
                </span>

                <strong className="specialist-card__section-value">{methods.join(', ')}</strong>
            </section>

            <section className="specialist-card__section specialist-card__topics">
                <span className="specialist-card__section-title">
                    {t('psychologists:card.worksWith')}
                </span>

                <div className="specialist-card__topic-list">
                    {topics.map((topic) => (
                        <span className="specialist-card__topic" key={topic}>
                            {t(`symptoms:${topic}.title`)}
                        </span>
                    ))}
                </div>
            </section>

            <div className="specialist-card__actions">
                {!isBooking && (
                    <Button
                        className="specialist-card__booking-button"
                        variant="primary"
                        size="medium"
                        fullWidth
                        onClick={() => setIsBooking(true)}
                    >
                        {t('psychologists:card.bookSession')}
                    </Button>
                )}

                {isBooking && (
                    <div className="specialist-card__availability">
                        <span className="specialist-card__availability-title">
                            {t('psychologists:card.availableTime')}
                        </span>

                        <div
                            className="specialist-card__slots"
                            role="radiogroup"
                            aria-label={t('accessibility:specialistCard.availableTimes', { name })}
                        >
                            {timeSlots.map((slot) => (
                                <TimeSlot
                                    key={slot.time}
                                    label={formatTimeSlot(slot.time)}
                                    value={slot.time}
                                    name={`specialist-time-${radioGroupId}`}
                                    checked={selectedSlot === slot.time}
                                    onChange={setSelectedSlot}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <OutlineButton
                    className="specialist-card__profile-button"
                    variant="secondary"
                    fullWidth
                >
                    {t('psychologists:card.viewProfile')}
                </OutlineButton>
            </div>
        </article>
    )
}
