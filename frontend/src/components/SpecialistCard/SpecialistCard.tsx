import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '../UI/Avatar'
import { OutlineButton, PrimaryButton } from '../UI/Buttons'
import { AvatarFallbackIcon, AwardIcon, MoneyIcon } from '../UI/Icons'
import { TimeSlot } from '../UI/TimeSlot'

import type { SymptomCode } from '../../types/psychologist.ts'

import './SpecialistCard.scss'

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

const getNearestTimeSlots = (timeSlots: TimeSlotItem[]) => {
    const sortedSlots = [...timeSlots].sort(
        (firstSlot, secondSlot) =>
            new Date(firstSlot.time).getTime() - new Date(secondSlot.time).getTime(),
    )

    if (sortedSlots.length <= 2) {
        return sortedSlots
    }

    const nearestSlots: TimeSlotItem[] = []

    for (const slot of sortedSlots) {
        const slotDate = new Date(slot.time)

        const alreadyHasSameDay = nearestSlots.some((nearestSlot) =>
            isSameDay(new Date(nearestSlot.time), slotDate),
        )

        if (!alreadyHasSameDay) {
            nearestSlots.push(slot)
        }

        if (nearestSlots.length === 2) {
            return nearestSlots
        }
    }

    for (const slot of sortedSlots) {
        const alreadyAdded = nearestSlots.some((nearestSlot) => nearestSlot.time === slot.time)

        if (!alreadyAdded) {
            nearestSlots.push(slot)
        }

        if (nearestSlots.length === 2) {
            break
        }
    }

    return nearestSlots
}

export const SpecialistCard = ({
    id,
    name,
    avatar,
    experience,
    price,
    topics,
    timeSlots,
}: Props) => {
    const { t, i18n } = useTranslation(['psychologists', 'symptoms', 'accessibility'])

    const cardRef = useRef<HTMLElement>(null)
    const radioGroupId = useId()

    const [isBooking, setIsBooking] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState('')

    const nearestTimeSlots = getNearestTimeSlots(timeSlots)

    useEffect(() => {
        if (!isBooking) {
            return
        }

        const handleClickOutside = (event: PointerEvent) => {
            if (!cardRef.current) {
                return
            }

            if (!cardRef.current.contains(event.target as Node)) {
                setIsBooking(false)
                setSelectedSlot('')
            }
        }

        document.addEventListener('pointerdown', handleClickOutside)

        return () => {
            document.removeEventListener('pointerdown', handleClickOutside)
        }
    }, [isBooking])

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

    const formattedPrice = new Intl.NumberFormat('uk-UA', {
        maximumFractionDigits: 0,
    }).format(Number(price))

    return (
        <article
            ref={cardRef}
            className="specialist-card"
            aria-labelledby={`specialist-${id}-name`}
        >
            <header className="specialist-card__header">
                <Avatar
                    src={avatar ?? undefined}
                    fallback={<AvatarFallbackIcon />}
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

            <div className="specialist-card__stats">
                <div className="specialist-card__stat">
                    <span className="specialist-card__stat-icon" aria-hidden="true">
                        <AwardIcon />
                    </span>

                    <div className="specialist-card__stat-content">
                        <span className="specialist-card__stat-label">
                            {t('psychologists:card.experience')}
                        </span>

                        <strong className="specialist-card__stat-value">
                            {t('psychologists:card.experienceYears', {
                                count: experience,
                            })}
                        </strong>
                    </div>
                </div>

                <div className="specialist-card__stat">
                    <span className="specialist-card__stat-icon" aria-hidden="true">
                        <MoneyIcon />
                    </span>

                    <div className="specialist-card__stat-content">
                        <span className="specialist-card__stat-label">
                            {t('psychologists:card.sessionDuration')}
                        </span>

                        <strong className="specialist-card__stat-value">
                            {t('psychologists:card.price', {
                                price: formattedPrice,
                            })}
                        </strong>
                    </div>
                </div>
            </div>

            <section className="specialist-card__topics">
                <span className="specialist-card__topics-title">
                    {t('psychologists:card.worksWith')}
                </span>

                <div className="specialist-card__topic-list">
                    {topics.map((topic) => (
                        <span className="specialist-card__topic" key={topic}>
                            {t(`symptoms:${topic}`)}
                        </span>
                    ))}
                </div>
            </section>

            <div className="specialist-card__actions">
                {!isBooking && (
                    <PrimaryButton
                        className="specialist-card__booking-button"
                        fullWidth
                        onClick={() => setIsBooking(true)}
                    >
                        {t('psychologists:card.bookSession')}
                    </PrimaryButton>
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
                            {nearestTimeSlots.map((slot) => (
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
