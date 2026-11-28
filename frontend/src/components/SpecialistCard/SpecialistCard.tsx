import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { Psychologist } from '../../types/psychologist'
import { BookingModalButton } from '../Booking/BookingModalButton'
import { OutlineButton } from '../UI/Buttons'
import { AwardIcon, MoneyIcon } from '../UI/Icons'

import './SpecialistCard.scss'
import { InfoTile } from '../InfoTile'
import { SpecialistIdentity } from '../SpecialistIdentity'

type Props = Omit<Psychologist, 'methods'> & {
    variant?: 'default' | 'compact'
    className?: string
}

export const SpecialistCard = ({
    psychologist_id: id,
    full_name: name,
    avatar_url: avatar,
    experience_years: experience,
    price_per_hour: price,
    session_minutes: sessionMinutes = 50,
    topics,
    mock_slots: timeSlots,
    variant = 'default',
    className,
}: Props) => {
    const { t } = useTranslation(['psychologists', 'symptoms'])
    const navigate = useNavigate()

    const safeTopics = Array.isArray(topics) ? topics : []
    const formattedPrice = new Intl.NumberFormat('uk-UA', {
        maximumFractionDigits: 0,
    }).format(Number(price))

    return (
        <article
            className={classNames('specialist-card', `specialist-card--${variant}`, className)}
            aria-labelledby={`specialist-${id}-name`}
        >
            <header className="specialist-card__header">
                <SpecialistIdentity
                    name={name}
                    avatarUrl={avatar}
                    isVerified
                    nameAs="h3"
                    nameId={`specialist-${id}-name`}
                />
            </header>

            <div className="specialist-card__stats">
                <InfoTile
                    as="div"
                    icon={<AwardIcon />}
                    label={t('psychologists:card.experience')}
                    value={t('psychologists:card.experienceYears', { count: experience })}
                />

                <InfoTile
                    as="div"
                    icon={<MoneyIcon />}
                    label={t('psychologists:card.sessionDuration', { minutes: sessionMinutes })}
                    value={t('psychologists:card.price', { price: formattedPrice })}
                />
            </div>

            <section className="specialist-card__topics">
                <span className="specialist-card__topics-title">
                    {t('psychologists:card.worksWith')}
                </span>

                <div className="specialist-card__topic-list">
                    {safeTopics.map((topic) => (
                        <span className="specialist-card__topic" key={topic}>
                            {t(`symptoms:${topic}.title`)}
                        </span>
                    ))}
                </div>
            </section>

            <div className="specialist-card__actions">
                <BookingModalButton
                    specialist={{
                        psychologist_id: id,
                        full_name: name,
                        avatar_url: avatar,
                        price_per_hour: price,
                        session_minutes: sessionMinutes,
                    }}
                    slots={Array.isArray(timeSlots) ? timeSlots : []}
                />

                <OutlineButton
                    className="specialist-card__profile-button"
                    variant="secondary"
                    fullWidth
                    onClick={() => navigate(`/psychologist-profile/${id}`)}
                >
                    {t('psychologists:card.viewProfile')}
                </OutlineButton>
            </div>
        </article>
    )
}
