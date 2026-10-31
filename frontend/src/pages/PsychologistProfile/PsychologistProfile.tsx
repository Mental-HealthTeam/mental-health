import { useEffect } from 'react'
import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { Container } from '../../components/Container'

import { SpecialistProfileCard } from './components/SpecialistProfileCard'

import './PsychologistProfile.scss'
import { ProfileTabs } from './components/ProfileTabs'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { setSpecialistProfile } from '../../app/store/slices/specialistProfileSlice'
import { useTranslation } from 'react-i18next'
import { AiChat } from '../../components/AiChat'
import { BookingBlock } from '../../components/BookingBlock'
import { useGetPsychologistByIdQuery } from '../../services/psychologistsApi'
import { skipToken } from '@reduxjs/toolkit/query'

export const PsychologistProfile = () => {
    const { t, i18n } = useTranslation('specialistProfile')
    const { profile } = useAppSelector((state) => state.specialistProfile)
    const { id } = useParams()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
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

    if (isLoading) {
        return <p>Завантаження...</p>
    }

    if (isError || !psychologist) {
        return <p>Не вдалося завантажити профіль</p>
    }

    return (
        <div className="psychologist-profile">
            <Header />

            <main className="psychologist-profile__content">
                <Container className="psychologist-profile__container">
                    <a className="psychologist-profile__back" onClick={() => navigate(-1)}>
                        {t('page.back')}
                    </a>
                    {profile && <h1 className="psychologist-profile__title">{t('page.title')}</h1>}

                    {profile && (
                        <SpecialistProfileCard
                            className="psychologist-profile__specialist-card"
                            actions={
                                <BookingBlock name={profile.full_name} slots={profile.mock_slots} />
                            }
                            specialist={profile}
                        />
                    )}

                    {profile && <ProfileTabs className="psychologist-profile__profile-tabs" />}

                    {!profile && (
                        <div className="psychologist-profile__text-no-profile">
                            {t('page.noProfile')}
                        </div>
                    )}
                </Container>
            </main>

            <Footer />

            <AiChat />
        </div>
    )
}
