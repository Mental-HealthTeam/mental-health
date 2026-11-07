import { skipToken } from '@reduxjs/toolkit/query'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'

import { BookingSummaryCard } from '../../components/BookingSummaryCard'
import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { BackButton } from '../../components/UI/Buttons/BackButton'
import {
    useGetBookingByIdQuery,
    useGetPsychologistByIdQuery,
} from '../../services/psychologistsApi'

import './SuccessPage.scss'

const mockNames = {
    uk: 'Катерина Ковальська',
    en: 'Kateryna Kovalska',
}

const mockBooking = {
    status: 'confirmed',
    psychologist: {
        psychologist_id: 'preview-psychologist',
        avatar_url: '',
        is_verified: true,
    },
    selected_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    price: '2500',
}

const mockPsychologist = {
    experience_years: 8,
}

export const SuccessPage = () => {
    const [searchParams] = useSearchParams()
    const { t, i18n } = useTranslation('success')

    const language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'uk'
    const bookingId = searchParams.get('booking_id')

    const isPreview = import.meta.env.DEV && searchParams.get('preview') === 'true' && !bookingId

    const {
        currentData: bookingData,
        isFetching: isBookingFetching,
        isError: isBookingError,
    } = useGetBookingByIdQuery(
        bookingId
            ? {
                  id: bookingId,
                  lang: language,
              }
            : skipToken,
    )

    const booking = isPreview
        ? {
              ...mockBooking,
              psychologist: {
                  ...mockBooking.psychologist,
                  full_name: mockNames[language],
              },
          }
        : bookingData

    const {
        currentData: psychologistData,
        isFetching: isPsychologistFetching,
        isError: isPsychologistError,
    } = useGetPsychologistByIdQuery(
        !isPreview && booking?.status === 'confirmed'
            ? {
                  id: booking.psychologist.psychologist_id,
                  lang: language,
              }
            : skipToken,
    )

    const psychologist = isPreview ? mockPsychologist : psychologistData
    const isLoading = !isPreview && (isBookingFetching || isPsychologistFetching)

    let stateMessage: string | null = null
    let isError = false

    if (!bookingId && !isPreview) {
        stateMessage = t('states.missingBookingId')
        isError = true
    } else if (!isPreview && isBookingFetching) {
        stateMessage = t('states.loading')
    } else if ((!isPreview && isBookingError) || !booking) {
        stateMessage = t('states.loadError')
        isError = true
    } else if (booking.status !== 'confirmed') {
        stateMessage = booking.status === 'pending' ? t('states.pending') : t('states.notConfirmed')
    } else if (!isPreview && isPsychologistFetching) {
        stateMessage = t('states.loading')
    } else if ((!isPreview && isPsychologistError) || !psychologist) {
        stateMessage = t('states.loadError')
        isError = true
    }

    return (
        <div className="success-page">
            <Header />

            <main className="success-page__main" aria-busy={isLoading}>
                <div className="success-page__container">
                    <BackButton className="success-page__back" />

                    {stateMessage !== null && (
                        <div className="success-page__state">
                            <p role={isError ? 'alert' : 'status'}>{stateMessage}</p>
                        </div>
                    )}

                    {stateMessage === null && booking?.status === 'confirmed' && psychologist && (
                        <section
                            className="success-page__content"
                            aria-labelledby="success-page-title"
                        >
                            <h1 className="success-page__title" id="success-page-title">
                                {t('title')}
                            </h1>

                            <p className="success-page__description">{t('description')}</p>

                            <div className="success-page__card">
                                <BookingSummaryCard
                                    psychologist_id={booking.psychologist.psychologist_id}
                                    full_name={booking.psychologist.full_name}
                                    avatar_url={booking.psychologist.avatar_url}
                                    experience_years={psychologist.experience_years}
                                    price_per_hour={booking.price}
                                    selected_time={booking.selected_time}
                                    is_verified={
                                        'is_verified' in booking.psychologist &&
                                        booking.psychologist.is_verified === true
                                    }
                                />
                            </div>

                            <Link className="success-page__cabinet-link" to="/cabinet">
                                {t('cabinetLink')}
                            </Link>
                        </section>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    )
}
