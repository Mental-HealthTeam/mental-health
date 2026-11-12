import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { Container } from '../../components/Container'
import { AiChat } from '../../components/AiChat'
import { SPECIALIST_MOCK } from '../../mocks/specialistMock'
import { SESSIONS_MOCK } from '../../mocks/sessions'
import { SpecialistProfileCard } from '../../components/specialist/SpecialistProfileCard'
import { ProfileTabs } from '../../components/specialist/ProfileTabs'
import { MySessions } from './components/MySessions'
import { OutlineButton } from '../../components/UI/Buttons'
import { BackButton } from '../../components/UI/Buttons/BackButton'

import './SpecialistCabinet.scss'

export const SpecialistCabinet = () => {
    const navigate = useNavigate()
    const { t } = useTranslation('specialistCabinet')

    // тимчасові моки, потім я їх після підключення заберу
    const specialist = SPECIALIST_MOCK
    const sessions = SESSIONS_MOCK

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [])

    return (
        <div className="specialist-cabinet">
            <Header />

            <main className="specialist-cabinet__content">
                <Container className="specialist-cabinet__container">
                    <BackButton />

                    {specialist ? (
                        <>
                            <h1 className="specialist-cabinet__title">{t('title')}</h1>

                            <SpecialistProfileCard
                                className="specialist-cabinet__specialist-card"
                                specialist={specialist}
                                actions={
                                    <OutlineButton
                                        className="specialist-cabinet__button"
                                        variant="secondary"
                                        fullWidth
                                        onClick={() => navigate('/specialist/settings/profile')}
                                    >
                                        {t('settingsProfile')}
                                    </OutlineButton>
                                }
                            />

                            <ProfileTabs
                                className="specialist-cabinet__profile-tabs"
                                specialist={specialist}
                            />

                            <MySessions
                                className="specialist-cabinet__my-sessions"
                                sessions={sessions}
                            />
                        </>
                    ) : (
                        <div className="specialist-cabinet__text-no-profile">
                            {t('noProfile')}
                        </div>
                    )}
                </Container>
            </main>

            <Footer />

            <AiChat />
        </div>
    )
}