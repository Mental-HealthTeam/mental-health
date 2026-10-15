import { useEffect } from 'react'
import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { Container } from '../../components/Container'
import { SpecialistCard } from '../../components/SpecialistCard'

import './PsychologistProfile.scss'
import { AboutCard } from './components/AboutCard'
import { EducationCard } from './components/EducationCard'
import { Specializations } from './components/Specializations'
import { Reviews } from './components/Reviews'

export const PsychologistProfile = () => {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [])

    return (
        <div className="psychologist-profile">
            <Header />

            <main className="psychologist-profile__content">
                <Container className="psychologist-profile__container">
                    <div className="psychologist-profile">
                        <h1 className="psychologist-profile__title">Профіль психолога</h1>
                        <div className="psychologist-profile__top">
                            <SpecialistCard
                                className="psychologist-profile__specialist-card"
                                variant="preview"
                            />

                            <div className="psychologist-profile__region-about">
                                <AboutCard className="psychologist-profile__about-card" />

                                <EducationCard className="psychologist-profile__education-card" />
                            </div>
                        </div>

                        <Specializations className="psychologist-profile__specializations" />

                        <Reviews className="psychologist-profile__reviews" />
                    </div>
                </Container>
            </main>

            <Footer />
        </div>
    )
}
