import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'

import type { Psychologist } from '../../types/psychologist'

import { Avatar } from '../UI/Avatar'
import { OutlineButton } from '../UI/Buttons'
import { AvatarFallbackIcon, AwardIcon, MoneyIcon } from '../UI/Icons'

import './BookingSummaryCard.scss'

type Props = Pick<
    Psychologist,
    'psychologist_id' | 'full_name' | 'avatar_url' | 'experience_years' | 'price_per_hour'
> & {
    selected_time: string
    is_verified: boolean
    className?: string
}

const isSameDay = (firstDate: Date, secondDate: Date) =>
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()

export const BookingSummaryCard = ({
    psychologist_id: id,
    full_name: name,
    avatar_url: avatar,
    experience_years: experience,
    price_per_hour: price,
    selected_time: selectedTime,
    is_verified: isVerified,
    className,
}: Props) => {
    const { t, i18n } = useTranslation(['psychologists', 'success'])
    const navigate = useNavigate()
    const titleId = useId()

    const language = i18n.resolvedLanguage ?? 'uk'
    const sessionDate = new Date(selectedTime)
    const hasValidDate = !Number.isNaN(sessionDate.getTime())

    const today = new Date()
    const tomorrow = new Date(today)

    tomorrow.setDate(today.getDate() + 1)

    const formattedPrice = new Intl.NumberFormat(language, {
        maximumFractionDigits: 0,
    }).format(Number(price))

    let slotLabel = ''
    let fullDateLabel = ''

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

        fullDateLabel = new Intl.DateTimeFormat(language, {
            dateStyle: 'full',
            timeStyle: 'short',
            hour12: false,
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
        <article
            className={classNames('booking-summary-card', className)}
            aria-labelledby={titleId}
        >
            <header className="booking-summary-card__header">
                <Avatar
                    src={avatar || undefined}
                    fallback={<AvatarFallbackIcon />}
                    alt=""
                    size="large"
                    className="booking-summary-card__avatar"
                />

                <div className="booking-summary-card__identity">
                    <h3 className="booking-summary-card__name" id={titleId}>
                        {name}
                    </h3>

                    {isVerified && (
                        <span className="booking-summary-card__verified">
                            {t('psychologists:card.verified')}
                        </span>
                    )}
                </div>
            </header>

            <div className="booking-summary-card__stats">
                <div className="booking-summary-card__stat">
                    <span className="booking-summary-card__stat-icon" aria-hidden="true">
                        <AwardIcon />
                    </span>

                    <div className="booking-summary-card__stat-content">
                        <span className="booking-summary-card__stat-label">
                            {t('psychologists:card.experience')}
                        </span>

                        <strong className="booking-summary-card__stat-value">
                            {t('psychologists:card.experienceYears', {
                                count: experience,
                            })}
                        </strong>
                    </div>
                </div>

                <div className="booking-summary-card__stat">
                    <span className="booking-summary-card__stat-icon" aria-hidden="true">
                        <MoneyIcon />
                    </span>

                    <div className="booking-summary-card__stat-content">
                        <span className="booking-summary-card__stat-label">
                            {t('psychologists:card.sessionDuration')}
                        </span>

                        <strong className="booking-summary-card__stat-value">
                            {t('psychologists:card.price', {
                                price: formattedPrice,
                            })}
                        </strong>
                    </div>
                </div>
            </div>

            <div className="booking-summary-card__session">
                <p className="booking-summary-card__session-title">
                    {t('success:card.bookedTime')}
                </p>

                {hasValidDate && (
                    <time
                        className="booking-summary-card__time"
                        dateTime={selectedTime}
                        aria-label={fullDateLabel}
                        title={fullDateLabel}
                    >
                        <span className="booking-summary-card__check" aria-hidden="true">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="10" fill="currentColor" />
                                <path
                                    d="M5.5 10L8.5 13L14.5 7"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>

                        <span>{slotLabel}</span>
                    </time>
                )}
            </div>

            <OutlineButton
                className="booking-summary-card__profile-button"
                variant="secondary"
                fullWidth
                onClick={() => navigate(`/psychologist-profile/${encodeURIComponent(id)}`)}
            >
                {t('psychologists:card.viewProfile')}
            </OutlineButton>
        </article>
    )
}
