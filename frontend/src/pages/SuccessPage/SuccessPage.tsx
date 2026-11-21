import { skipToken } from '@reduxjs/toolkit/query'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'

import { BookingSummaryCard } from '../../components/BookingSummaryCard'
import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { BackButton } from '../../components/UI/Buttons'
import {
    useGetBookingByIdQuery,
    useGetPsychologistByIdQuery,
} from '../../services/psychologistsApi'

import './SuccessPage.scss'

const POLLING_INTERVAL = 3000

export const SuccessPage = () => {
    const [searchParams] = useSearchParams()
    const { t, i18n } = useTranslation('success')

    const language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'uk'
    const bookingId = searchParams.get('booking_id')

    const {
        currentData: booking,
        isLoading: isBookingLoading,
        isError: isBookingError,
        refetch: refetchBooking,
    } = useGetBookingByIdQuery(
        bookingId
            ? {
                  id: bookingId,
                  lang: language,
              }
            : skipToken,
        {
            refetchOnMountOrArgChange: true,
        },
    )

    const isConfirmed = booking?.status === 'confirmed'
    const isPending = booking?.status === 'pending'

    useEffect(() => {
        if (!isPending) {
            return
        }

        const interval = window.setInterval(() => {
            void refetchBooking()
        }, POLLING_INTERVAL)

        return () => {
            window.clearInterval(interval)
        }
    }, [isPending, refetchBooking])

    const {
        currentData: psychologist,
        isLoading: isPsychologistLoading,
        isError: isPsychologistError,
    } = useGetPsychologistByIdQuery(
        booking
            ? {
                  id: booking.psychologist.psychologist_id,
                  lang: language,
              }
            : skipToken,
    )

    const isLoading = isBookingLoading || (Boolean(booking) && isPsychologistLoading)

    let stateMessage: string | null = null
    let isError = false

    if (!bookingId) {
        stateMessage = t('states.missingBookingId')
        isError = true
    } else if (isBookingLoading) {
        stateMessage = t('states.loading')
    } else if (isBookingError || !booking) {
        stateMessage = t('states.loadError')
        isError = true
    } else if (isPsychologistLoading) {
        stateMessage = t('states.loading')
    } else if (isPsychologistError || !psychologist) {
        stateMessage = t('states.loadError')
        isError = true
    }

    return (
        <div className="success-page">
            <Header variant={'page'} />

            <main className="success-page__main" aria-busy={isLoading}>
                <div className="success-page__container">
                    <BackButton className="success-page__back" />

                    {stateMessage !== null && (
                        <div className="success-page__state">
                            <p role={isError ? 'alert' : 'status'}>{stateMessage}</p>
                        </div>
                    )}

                    {stateMessage === null && booking && psychologist && (
                        <section
                            className="success-page__content"
                            aria-labelledby="success-page-title"
                        >
                            {isConfirmed && (
                                <>
                                    <h1 className="success-page__title" id="success-page-title">
                                        {t('title')}
                                    </h1>

                                    <p className="success-page__description">{t('description')}</p>
                                </>
                            )}

                            {!isConfirmed && (
                                <h1 className="success-page__title" id="success-page-title">
                                    {isPending ? t('states.pending') : t('states.notConfirmed')}
                                </h1>
                            )}

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

                                {isPending && (
                                    <p className="success-page__description" role="status">
                                        {t('states.pending')}
                                    </p>
                                )}

                                {!isPending && !isConfirmed && (
                                    <p className="success-page__description" role="alert">
                                        {t('states.notConfirmed')}
                                    </p>
                                )}
                            </div>

                            {isConfirmed && (
                                <Link className="success-page__cabinet-link" to="/cabinet">
                                    {t('cabinetLink')}
                                </Link>
                            )}
                        </section>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    )
}
