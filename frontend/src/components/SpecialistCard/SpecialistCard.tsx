import { useState } from 'react'

import { Avatar } from '../UI/Avatar'
import { OutlineButton, PrimaryButton } from '../UI/Buttons'
import { TimeSlot } from '../UI/TimeSlot'

import './SpecialistCard.scss'

type TimeSlotItem = {
    time_label: string
    time: string
}

type Props = {
    id: string
    name: string
    avatar: string | null
    experience: number
    price: string
    methods: string[]
    topics: string[]
    timeSlots: TimeSlotItem[]
}

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
    const [isBooking, setIsBooking] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState('')

    return (
        <article className="specialist-card">
            <header className="specialist-card__header">
                <Avatar
                    src={avatar ?? undefined}
                    alt={name}
                    size="large"
                    className="specialist-card__avatar"
                />

                <div className="specialist-card__identity">
                    <h3 className="specialist-card__name">{name}</h3>

                    <span className="specialist-card__verified">ПЕРЕВІРЕНО</span>
                </div>
            </header>

            <div className="specialist-card__meta">
                <div className="specialist-card__meta-row">
                    <span>Досвід</span>

                    <span className="specialist-card__dot" aria-hidden="true">
                        ·
                    </span>

                    <strong>{experience} років</strong>
                </div>

                <div className="specialist-card__meta-row">
                    <span>Сесія 1,5 години</span>

                    <span className="specialist-card__dot" aria-hidden="true">
                        ·
                    </span>

                    <strong>{price} ₴</strong>
                </div>
            </div>

            <section className="specialist-card__section">
                <span className="specialist-card__section-title">Терапевтичний підхід</span>

                <strong className="specialist-card__section-value">{methods.join(', ')}</strong>
            </section>

            <section className="specialist-card__section specialist-card__topics">
                <span className="specialist-card__section-title">Працює з темами:</span>

                <div className="specialist-card__topic-list">
                    {topics.map((topic) => (
                        <span className="specialist-card__topic" key={topic}>
                            {topic}
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
                        ЗАБРОНЮВАТИ СЕСІЮ
                    </PrimaryButton>
                )}

                {isBooking && (
                    <div className="specialist-card__availability">
                        <span className="specialist-card__availability-title">Вільний час</span>

                        <div className="specialist-card__slots">
                            {timeSlots.map((slot) => (
                                <TimeSlot
                                    key={slot.time}
                                    label={slot.time_label}
                                    value={slot.time}
                                    name={`specialist-time-${id}`}
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
                    ПЕРЕЙТИ ДО ПРОФІЛЮ
                </OutlineButton>
            </div>
        </article>
    )
}
