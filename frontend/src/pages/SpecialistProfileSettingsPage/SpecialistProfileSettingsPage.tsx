import { Container } from '../../components/Container'
import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { BackButton } from '../../components/UI/Buttons'
import { AboutField } from './components/AboutField'
import { AvatarUploader } from './components/AvatarUploader'
import { EducationList } from './components/EducationList'
import { PersonalDataCard } from './components/PersonalDataCard'
import { TopicsPicker } from './components/TopicsPicker/TopicsPicker'
import './SpecialistProfileSettingsPage.scss'

export const SpecialistProfileSettingsPage = () => {
    return (
        <div className="specialist-profile-settings">
            <Header variant="page" />

            <main className="specialist-profile-settings__content">
                <Container className="specialist-profile-settings__container">
                    <BackButton />

                    <h1 className="specialist-profile-settings__title">Налаштування профілю</h1>

                    <section className="specialist-profile-settings__section">
                        <h2 className="specialist-profile-settings__section-title">Мої дані</h2>

                        <AvatarUploader />
                        <PersonalDataCard />
                    </section>

                    <section className="specialist-profile-settings__section">
                        <h2 className="specialist-profile-settings__section-title">
                            Основна інформація
                        </h2>

                        <AboutField />
                        <EducationList />
                        <TopicsPicker />
                    </section>

                    <div className="specialist-profile-settings__actions">
                        <button type="button" className="specialist-profile-settings__save-button">
                            Зберегти зміни
                        </button>
                    </div>
                </Container>
            </main>

            <Footer variant="page" />
        </div>
    )
}
