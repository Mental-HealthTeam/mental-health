import { useEffect } from 'react'
import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { Container } from '../../components/Container'

import { SpecialistProfileCard } from './components/SpecialistProfileCard'

import './PsychologistProfile.scss'
import { ProfileTabs } from './components/ProfileTabs'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { setSpecialistProfile } from '../../app/store/slices/specialistProfileSlice'
import { SPECIALIST_MOCK } from '../../mocks/specialistMock'
import { useTranslation } from 'react-i18next'

export const PsychologistProfile = () => {
    const { t } = useTranslation('specialistProfile')
    const { profile } = useAppSelector((state) => state.specialistProfile)
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
        dispatch(setSpecialistProfile(SPECIALIST_MOCK))
    }, [dispatch])

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
                        <SpecialistProfileCard className="psychologist-profile__specialist-card" />
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
        </div>
    )
}
