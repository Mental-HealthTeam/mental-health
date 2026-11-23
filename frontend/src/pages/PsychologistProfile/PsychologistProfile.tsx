import { skipToken } from '@reduxjs/toolkit/query'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { useAppDispatch } from '../../app/hooks'
import { setSpecialistProfile } from '../../app/store/slices/specialistProfileSlice'

import { AiChat } from '../../components/AiChat'
import { BookingModalButton } from '../../components/Booking/BookingModalButton'
import { PendingBookingButton } from '../../components/Booking/PendingBookingButton'
import { Container } from '../../components/Container'
import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { ProfileTabs } from '../../components/specialist/ProfileTabs'
import { ProfileTabsSkeleton } from '../../components/specialist/ProfileTabs/ProfileTabsSkeleton'
import { SpecialistProfileCard } from '../../components/specialist/SpecialistProfileCard'
import { BackButton } from '../../components/UI/Buttons'
import { Skeleton } from '../../components/UI/Skeleton'

import { useGetPsychologistByIdQuery } from '../../services/psychologistsApi'

import './PsychologistProfile.scss'

export const PsychologistProfile = () => {
    const { t, i18n } = useTranslation(['specialistProfile', 'common', 'errors'])
    const { id } = useParams()
    const dispatch = useAppDispatch()

    const {
        currentData: profile,
        isFetching,
        isError,
    } = useGetPsychologistByIdQuery(id ? { id, lang: i18n.language } : skipToken, {
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
        refetchOnReconnect: true,
    })

    const isProfileLoading = isFetching && !profile

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [id])

    useEffect(() => {
        if (profile) {
            dispatch(setSpecialistProfile(profile))
        }
    }, [dispatch, profile])

    const renderContent = () => {
        if (isProfileLoading) {
            return (
                <>
                    <h1 className="psychologist-profile__title">{t('page.title')}</h1>

                    <div
                        className="psychologist-profile__specialist-card"
                        role="status"
                        aria-label={t('common:loading')}
                        style={{ display: 'grid', width: '100%' }}
                    >
                        <Skeleton width="100%" height={320} radius={24} />
                    </div>

                    <ProfileTabsSkeleton className="psychologist-profile__profile-tabs" />
                </>
            )
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
