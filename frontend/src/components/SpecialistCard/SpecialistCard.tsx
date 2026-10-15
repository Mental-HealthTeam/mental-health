import { useState } from 'react'

import avatarImage from '../../assets/avatars/avatar-1.png'

import { Avatar } from '../UI/Avatar'
import { Button } from '../UI/Button'
import { TimeSlot } from '../UI/TimeSlot'

import './SpecialistCard.scss'
import { OutlineButton } from '../UI/Buttons'
import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'

type Props = {
    className?: string
    variant?: 'preview' | 'full'
}

const TIME_SLOTS = [
    {
        value: 'today-12',
        label: 'СЬОГОДНІ 12:00',
    },
    {
        value: 'tomorrow-19',
        label: 'ЗАВТРА 19:00',
    },
]

const TOPICS = ['СТРЕС', 'СДВГ', 'СТОСУНКИ', 'ПТСР']

export const SpecialistCard = ({ className, variant = 'full' }: Props) => {
    const navigate = useNavigate()
    const [isBooking, setIsBooking] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState('')
    const isPreview = variant === 'full'

    return (
        <article
            className={classNames('specialist-card', `specialist-card--${variant}`, className)}
        >
            <header className="specialist-card__header">
                <Avatar
                    src={avatarImage}
                    alt="Катерина Ковальська"
                    size="large"
                    className="specialist-card__avatar"
                />

                <div className="specialist-card__identity">
                    <h3 className="specialist-card__name">Катерина Ковальська</h3>

                    <span className="specialist-card__verified">ПЕРЕВІРЕНО</span>
                </div>
            </header>

            <div className="specialist-card__meta">
                <div className="specialist-card__meta-row">
                    <span>Досвід</span>

                    <span className="specialist-card__dot" aria-hidden="true">
                        ·
                    </span>

                    <strong>8 років</strong>
                </div>

                <div className="specialist-card__meta-row">
                    <span>Сесія 1,5 години</span>

                    <span className="specialist-card__dot" aria-hidden="true">
                        ·
                    </span>

                    <strong>2 500 ₴</strong>
                </div>
            </div>

            <section className="specialist-card__section">
                <span className="specialist-card__section-title">Терапевтичний підхід</span>

                <strong className="specialist-card__section-value">Гештальт-терапія, КПТ</strong>
            </section>

            {isPreview && (
                <section className="specialist-card__section specialist-card__topics">
                    <span className="specialist-card__section-title">Працює з темами:</span>

                    <div className="specialist-card__topic-list">
                        {TOPICS.map((topic) => (
                            <span className="specialist-card__topic" key={topic}>
                                {topic}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            <div className="specialist-card__actions">
                {!isBooking && (
                    <Button
                        className="specialist-card__booking-button"
                        variant="primary"
                        size="medium"
                        fullWidth
                        onClick={() => setIsBooking(true)}
                    >
                        ЗАБРОНЮВАТИ СЕСІЮ
                    </Button>
                )}

                {isBooking && (
                    <div className="specialist-card__availability">
                        <span className="specialist-card__availability-title">Вільний час</span>

                        <div className="specialist-card__slots">
                            {TIME_SLOTS.map((slot) => (
                                <TimeSlot
                                    key={slot.value}
                                    label={slot.label}
                                    value={slot.value}
                                    name="specialist-time"
                                    checked={selectedSlot === slot.value}
                                    onChange={setSelectedSlot}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {isPreview && (
                    <OutlineButton
                        className="specialist-card__profile-button"
                        variant="secondary"
                        fullWidth
                        onClick={() => navigate('/psychologist-profile')}
                    >
                        ПЕРЕЙТИ ДО ПРОФІЛЮ
                    </OutlineButton>
                )}
            </div>
        </article>
    )
}
