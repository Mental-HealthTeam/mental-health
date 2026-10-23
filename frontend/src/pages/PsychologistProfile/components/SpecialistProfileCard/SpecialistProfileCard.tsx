import classNames from 'classnames'
import { Button } from '../../../../components/UI/Button'

import './SpecialistProfileCard.scss'
import { InfoTile } from '../../../../components/InfoTile'
import { LearnIcon } from '../../../../components/UI/Icons/WhyChoosePlatform'
import { ClockCardIcon, MoneyIcon } from '../../../../components/UI/Icons'
import { useAppSelector } from '../../../../app/hooks'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TimeSlot } from '../../../../components/UI/TimeSlot'

type Props = {
    className?: string
}

const isSameDay = (firstDate: Date, secondDate: Date) =>
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()

export const SpecialistProfileCard = ({ className }: Props) => {
    const { t, i18n } = useTranslation(['psychologists', 'symptoms', 'accessibility'])
    const { profile } = useAppSelector((state) => state.specialistProfile)
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
        <section className={classNames('profile-card', className)}>
            <img className="profile-card__photo" src={profile?.avatar_url} alt="" />

            <div className="profile-card__heading">
                {profile?.is_verified && <span className="profile-card__badge">Перевірено</span>}

                <h2 className="profile-card__name" id="profile-card-name">
                    {profile?.name}
                </h2>

                <p className="profile-card__role">Практикуючий психолог</p>
            </div>

            <ul className="profile-card__stats">
                <InfoTile
                    className="profile-card__info-tile"
                    icon={<LearnIcon />}
                    label="Досвід"
                    value={`${profile?.experience_years} років`}
                />
                <InfoTile
                    className="profile-card__info-tile"
                    icon={<MoneyIcon />}
                    label="Вартість"
                    value={`${profile?.price_uah} ₴`}
                />
                <InfoTile
                    className="profile-card__info-tile profile-card__info-tile--hide"
                    icon={<ClockCardIcon />}
                    label="Тривалість сесії"
                    value={`${profile?.session_minutes} хвилин`}
                />
            </ul>

            <div className="profile-card__approach">
                <p className="profile-card__approach-label">Терапевтичний підхід:</p>
                <p className="profile-card__approach-value">{profile?.methods.join(', ')}</p>
            </div>

            <div className="profile-card__region-button">
                {!isBooking && (
                    <Button
                        className="profile-card__booking-button"
                        variant="primary"
                        size="medium"
                        fullWidth
                        onClick={() => setIsBooking(true)}
                    >
                        {t('psychologists:card.bookSession')}
                    </Button>
                )}

                {isBooking && (
                    <div className="profile-card__availability">
                        <span className="profile-card__availability-title">Вільний час</span>

                        {profile?.mock_slots && (
                            <div
                                className="profile-card__slots"
                                role="radiogroup"
                                aria-label={t('accessibility:specialistCard.availableTimes', {
                                    name,
                                })}
                            >
                                {profile.mock_slots.map((slot) => {
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
        </section>
    )
}
