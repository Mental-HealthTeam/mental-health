import { useEffect } from 'react'
import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { Container } from '../../components/Container'
import { useNavigate } from 'react-router-dom'
import { SPECIALIST_MOCK } from '../../mocks/specialistMock'
import { AiChat } from '../../components/AiChat'
import { SESSIONS_MOCK } from '../../mocks/sessions'
import { SpecialistProfileCard } from '../../components/specialist/SpecialistProfileCard'
import { ProfileTabs } from '../../components/specialist/ProfileTabs'
import { MySessions } from './components/MySessions'

import './SpecialistCabinet.scss'
import { OutlineButton } from '../../components/UI/Buttons'

export const SpecialistCabinet = () => {
    const navigate = useNavigate()

    //тимчасові SPECIALIST_MOCK та SESSIONS_MOCK
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
                    <a className="specialist-cabinet__back" onClick={() => navigate(-1)}>
                        НАЗАД
                    </a>
                    {specialist && <h1 className="specialist-cabinet__title">Мій Кабінет</h1>}

                    {specialist && (
                        <SpecialistProfileCard
                            className="specialist-cabinet__specialist-card"
                            actions={
                                <OutlineButton
                                    className="specialist-cabinet__button"
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => navigate('/')}
                                >
                                    Налаштувати профіль
                                </OutlineButton>
                            }
                            specialist={specialist}
                        />
                    )}

                    {specialist && (
                        <ProfileTabs
                            className="specialist-cabinet__profile-tabs"
                            specialist={specialist}
                        />
                    )}

                    {specialist && (
                        <MySessions
                            className="specialist-cabinet__my-sessions"
                            sessions={sessions}
                        />
                    )}

                    {!specialist && (
                        <div className="specialist-cabinet__text-no-profile">Кабінет відсутній</div>
                    )}
                </Container>
            </main>

            <Footer />

            <AiChat />
        </div>
    )
}
