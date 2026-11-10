import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'

import hourglassImage from '../../assets/images/errors/hourglass.png'
import { Container } from '../../components/Container'
import { Header } from '../../components/Header'
import { BackButton } from '../../components/UI/Buttons/BackButton'
import { TimeSlot } from '../../components/UI/TimeSlot'

import './SlotUnavailablePage.scss'

type SlotUnavailableState = {
    psychologistId: string
    nearestAvailableSlot?: string | null
}

export const SlotUnavailablePage = () => {
    const { t, i18n } = useTranslation('errors')
    const location = useLocation()
    const radioGroupId = useId()
    const [selectedSlot, setSelectedSlot] = useState('')

    const state = location.state as SlotUnavailableState | null

    const psychologistId = state?.psychologistId
    const nearestAvailableSlot = state?.nearestAvailableSlot
    const slotDate = nearestAvailableSlot ? new Date(nearestAvailableSlot) : null
    const hasAvailableSlot = slotDate !== null && !Number.isNaN(slotDate.getTime())

    const profilePath = psychologistId
        ? `/psychologists/${encodeURIComponent(psychologistId)}`
        : '/#psychologists'

    const slotLabel =
        hasAvailableSlot && slotDate
            ? new Intl.DateTimeFormat(i18n.resolvedLanguage ?? 'uk', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
              }).format(slotDate)
            : ''

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
                        <h1
                            className="slot-unavailable-page__title"
                            id="slot-unavailable-page-title"
                        >
                            {t('slotUnavailablePage.title')}
                        </h1>

                        <p className="slot-unavailable-page__description">
                            {t('slotUnavailablePage.description')}
                            <br />
                            {t('slotUnavailablePage.suggestion')}
                        </p>

                        <img
                            className="slot-unavailable-page__image"
                            src={hourglassImage}
                            alt=""
                            width={318}
                            height={266}
                        />

                        <div className="slot-unavailable-page__actions">
                            {psychologistId && hasAvailableSlot && nearestAvailableSlot && (
                                <div className="slot-unavailable-page__slot">
                                    <p className="slot-unavailable-page__slot-title">
                                        {t('slotUnavailablePage.nearestSlot')}
                                    </p>

                                    <TimeSlot
                                        label={slotLabel}
                                        value={nearestAvailableSlot}
                                        name={`available-time-${radioGroupId}`}
                                        checked={selectedSlot === nearestAvailableSlot}
                                        onChange={setSelectedSlot}
                                    />
                                </div>
                            )}

                            <Link
                                className="slot-unavailable-page__time-link"
                                to={profilePath}
                                state={
                                    psychologistId && selectedSlot === nearestAvailableSlot
                                        ? { selectedSlot }
                                        : undefined
                                }
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
                    <p>
                        {t('slotUnavailablePage.copyright', {
                            year: new Date().getFullYear(),
                        })}
                    </p>
                </Container>
            </footer>
        </div>
    )
}
