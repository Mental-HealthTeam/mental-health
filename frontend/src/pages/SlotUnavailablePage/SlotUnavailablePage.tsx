import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'

import hourglassImage from '../../assets/images/errors/hourglass.png'
import { Container } from '../../components/Container'
import { Header } from '../../components/Header'
import { BackButton } from '../../components/UI/Buttons'
import { TimeSlot } from '../../components/UI/TimeSlot'

import './SlotUnavailablePage.scss'

type SlotUnavailableState = {
    psychologistId?: string
    nearestAvailableSlot?: string | null
}

const isSameDay = (first: Date, second: Date) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()

export const SlotUnavailablePage = () => {
    const { t, i18n } = useTranslation('errors')
    const location = useLocation()
    const radioGroupId = useId()
    const [selectedSlot, setSelectedSlot] = useState('')

    const state = location.state as SlotUnavailableState | null

    const psychologistId = state?.psychologistId
    const nearestAvailableSlot = state?.nearestAvailableSlot
    const language = i18n.resolvedLanguage ?? i18n.language ?? 'uk'

    const slotDate = nearestAvailableSlot ? new Date(nearestAvailableSlot) : null
    const hasAvailableSlot = slotDate !== null && !Number.isNaN(slotDate.getTime())

    const profilePath = psychologistId
        ? `/psychologist-profile/${encodeURIComponent(psychologistId)}`
        : '/catalog'

    const formatSlotLabel = () => {
        if (!hasAvailableSlot || !slotDate) {
            return ''
        }

        const today = new Date()
        const tomorrow = new Date(today)

        tomorrow.setDate(today.getDate() + 1)

        const time = new Intl.DateTimeFormat(language, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(slotDate)

        if (isSameDay(slotDate, today)) {
            return t('slotUnavailablePage.todayAt', { time })
        }

        if (isSameDay(slotDate, tomorrow)) {
            return t('slotUnavailablePage.tomorrowAt', { time })
        }

        return new Intl.DateTimeFormat(language, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(slotDate)
    }

    const selectedSlotState =
        psychologistId && hasAvailableSlot && selectedSlot && selectedSlot === nearestAvailableSlot
            ? { selectedSlot }
            : undefined

    return (
        <div className="slot-unavailable-page">
            <Header variant="page" />

            <main className="slot-unavailable-page__main">
                <Container className="slot-unavailable-page__container">
                    <BackButton className="slot-unavailable-page__back" />

                    <section
                        className="slot-unavailable-page__content"
                        aria-labelledby="slot-unavailable-page-title"
                    >
                        <div className="slot-unavailable-page__heading">
                            <h1
                                className="slot-unavailable-page__title"
                                id="slot-unavailable-page-title"
                            >
                                {t('slotUnavailablePage.title')}
                            </h1>

                            <p className="slot-unavailable-page__description">
                                <span>{t('slotUnavailablePage.description')}</span>

                                <span>{t('slotUnavailablePage.suggestion')}</span>
                            </p>
                        </div>

                        <img
                            className="slot-unavailable-page__image"
                            src={hourglassImage}
                            alt=""
                            width={318}
                            height={266}
                        />

                        <div className="slot-unavailable-page__actions">
                            <div className="slot-unavailable-page__slot">
                                {hasAvailableSlot && nearestAvailableSlot ? (
                                    <>
                                        <p className="slot-unavailable-page__slot-title">
                                            {t('slotUnavailablePage.nearestSlot')}
                                        </p>

                                        <TimeSlot
                                            label={formatSlotLabel()}
                                            value={nearestAvailableSlot}
                                            name={`available-time-${radioGroupId}`}
                                            checked={selectedSlot === nearestAvailableSlot}
                                            onChange={setSelectedSlot}
                                        />
                                    </>
                                ) : (
                                    <p className="slot-unavailable-page__slot-title">
                                        {t('slotUnavailablePage.noAvailableSlots')}
                                    </p>
                                )}
                            </div>

                            <Link
                                className="slot-unavailable-page__time-link"
                                to={profilePath}
                                state={selectedSlotState}
                            >
                                {psychologistId
                                    ? t('slotUnavailablePage.chooseAnotherTime')
                                    : t('notFoundPage.specialistsLink')}
                            </Link>
                        </div>
                    </section>
                </Container>
            </main>

            <footer className="slot-unavailable-page__footer">
                <Container>
                    <p className="slot-unavailable-page__copyright">
                        {t('slotUnavailablePage.copyright', {
                            year: new Date().getFullYear(),
                        })}
                    </p>
                </Container>
            </footer>
        </div>
    )
}
