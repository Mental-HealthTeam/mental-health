import { skipToken } from '@reduxjs/toolkit/query'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'

import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { SpecialistCard } from '../../components/SpecialistCard'
import { BackButton } from '../../components/UI/Buttons/BackButton'
import {
    useGetBookingByIdQuery,
    useGetPsychologistByIdQuery,
} from '../../services/psychologistsApi'

import './SuccessPage.scss'

export const SuccessPage = () => {
    const [searchParams] = useSearchParams()
    const { t, i18n } = useTranslation('success')

    const bookingId = searchParams.get('booking_id')

    const {
        currentData: booking,
        isFetching: isBookingFetching,
        isError: isBookingError,
    } = useGetBookingByIdQuery(bookingId || skipToken)

    const {
        currentData: psychologist,
        isFetching: isPsychologistFetching,
        isError: isPsychologistError,
    } = useGetPsychologistByIdQuery(
        booking?.status === 'confirmed'
            ? {
                  id: booking.psychologist.psychologist_id,
                  lang: i18n.resolvedLanguage ?? 'uk',
              }
            : skipToken,
    )

    const isLoading = isBookingFetching || isPsychologistFetching

    let stateMessage: string | null = null
    let isError = false

    if (!bookingId) {
        stateMessage = t('states.missingBookingId')
        isError = true
    } else if (isBookingFetching) {
        stateMessage = t('states.loading')
    } else if (isBookingError || !booking) {
        stateMessage = t('states.loadError')
        isError = true
    } else if (booking.status !== 'confirmed') {
        stateMessage = booking.status === 'pending' ? t('states.pending') : t('states.notConfirmed')
    } else if (isPsychologistFetching) {
        stateMessage = t('states.loading')
    } else if (isPsychologistError || !psychologist) {
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
                                <SpecialistCard
                                    psychologist_id={booking.psychologist.psychologist_id}
                                    full_name={booking.psychologist.full_name}
                                    avatar_url={booking.psychologist.avatar_url}
                                    experience_years={psychologist.experience_years}
                                    price_per_hour={booking.price}
                                    topics={psychologist.topics}
                                    mock_slots={[{ time: booking.selected_time }]}
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
