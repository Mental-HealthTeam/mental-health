import { useEffect } from 'react'
import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { Container } from '../../components/Container'

import { SpecialistProfileCard } from './components/SpecialistProfileCard'
import { SPECIALIST_MOCK } from '../../constants/specialistMock'

import './PsychologistProfile.scss'
import { ProfileTabs } from './components/ProfileTabs'
import { useNavigate } from 'react-router-dom'

export const PsychologistProfile = () => {
    const handleBook = () => {}
    const navigate = useNavigate()

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [])

    return (
        <div className="psychologist-profile">
            <Header />

            <main className="psychologist-profile__content">
                <Container className="psychologist-profile__container">
                    <a className="psychologist-profile__back" onClick={() => navigate(-1)}>НАЗАД</a>
                    <h1 className="psychologist-profile__title">Профіль фахівця</h1>
                    <SpecialistProfileCard
                        className="psychologist-profile__specialist-card"
                        specialist={SPECIALIST_MOCK}
                        onBook={handleBook}
                    />

                    <ProfileTabs className="psychologist-profile__profile-tabs" />
                </Container>
            </main>

            <Footer />
        </div>
    )
}
