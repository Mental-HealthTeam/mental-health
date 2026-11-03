import { useEffect } from 'react'
import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { Container } from '../../components/Container'

import { SpecialistProfileCard } from './components/SpecialistProfileCard'

import './PsychologistProfile.scss'
import { ProfileTabs } from './components/ProfileTabs'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { setSpecialistProfile } from '../../app/store/slices/specialistProfileSlice'
import { useTranslation } from 'react-i18next'
import { AiChat } from '../../components/AiChat'
import { BookingBlock } from '../../components/BookingBlock'
import { useGetPsychologistByIdQuery } from '../../services/psychologistsApi'
import { skipToken } from '@reduxjs/toolkit/query'
import { BackButton } from '../../components/UI/Buttons/BackButton'

export const PsychologistProfile = () => {
    const { t, i18n } = useTranslation(['specialistProfile', 'common', 'errors'])
    const { profile } = useAppSelector((state) => state.specialistProfile)
    const { id } = useParams()
    const dispatch = useAppDispatch()

    const {
        data: psychologist,
        isLoading,
        isError,
    } = useGetPsychologistByIdQuery(id ? { id, lang: i18n.language } : skipToken)

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
        if (psychologist) {
            dispatch(setSpecialistProfile(psychologist))
        }
    }, [dispatch, psychologist])

    const renderContent = () => {
        if (isLoading) {
            return <p role="status">{t('common:loading')}</p>
        }

        if (isError || !profile) {
            return <p role="alert">{t(`errors:notFound`)}</p>
        }

        return (
            <>
                <h1 className="psychologist-profile__title">{t('page.title')}</h1>

                <SpecialistProfileCard
                    className="psychologist-profile__specialist-card"
                    actions={<BookingBlock name={profile.full_name} slots={profile.mock_slots} />}
                    specialist={profile}
                />

                <ProfileTabs className="psychologist-profile__profile-tabs" />
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
