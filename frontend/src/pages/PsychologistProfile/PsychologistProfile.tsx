import { skipToken } from '@reduxjs/toolkit/query'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { setSpecialistProfile } from '../../app/store/slices/specialistProfileSlice'

import { AiChat } from '../../components/AiChat'
import { BookingModalButton } from '../../components/Booking/BookingModalButton'
import { PendingBookingButton } from '../../components/Booking/PendingBookingButton'
import { Container } from '../../components/Container'
import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { ProfileTabs } from '../../components/specialist/ProfileTabs'
import { SpecialistProfileCard } from '../../components/specialist/SpecialistProfileCard'
import { BackButton } from '../../components/UI/Buttons'

import { useGetPsychologistByIdQuery } from '../../services/psychologistsApi'

import './PsychologistProfile.scss'

export const PsychologistProfile = () => {
    const { t, i18n } = useTranslation(['specialistProfile', 'common', 'errors'])
    const { id } = useParams()

    const dispatch = useAppDispatch()
    const { profile } = useAppSelector((state) => state.specialistProfile)

    const {
        currentData: psychologist,
        isLoading,
        isError,
    } = useGetPsychologistByIdQuery(id ? { id, lang: i18n.language } : skipToken, {
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
        refetchOnReconnect: true,
    })

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [id])

    useEffect(() => {
        if (psychologist) {
            dispatch(setSpecialistProfile(psychologist))
        }
    }, [dispatch, psychologist])

    const renderContent = () => {
        if (isLoading) {
            return <p role="status">{t('common:loading')}</p>
        }

        if (isError || !profile || profile.psychologist_id !== id) {
            return <p role="alert">{t('errors:notFound')}</p>
        }

        return (
            <>
                <h1 className="psychologist-profile__title">{t('page.title')}</h1>

                <SpecialistProfileCard
                    className="psychologist-profile__specialist-card"
                    actions={
                        <>
                            <BookingModalButton specialist={profile} slots={profile.mock_slots} />

                            <PendingBookingButton psychologistId={profile.psychologist_id} />
                        </>
                    }
                    specialist={profile}
                />

                <ProfileTabs className="psychologist-profile__profile-tabs" specialist={profile} />
            </>
        )
    }

    return (
        <div className="psychologist-profile">
            <Header />

            <main className="psychologist-profile__content">
                <Container className="psychologist-profile__container">
                    <BackButton />

                    {renderContent()}
                </Container>
            </main>

            <Footer />

            <AiChat />
        </div>
    )
}
