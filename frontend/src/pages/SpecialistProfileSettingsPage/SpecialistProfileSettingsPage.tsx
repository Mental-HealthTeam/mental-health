import { useState } from 'react'
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
import type { OnFieldChange, ProfileFormState } from '../../types/specialist'
import { AiChat } from '../../components/AiChat'

export const SpecialistProfileSettingsPage = () => {
    const [avatarFile, setAvatarFile] = useState<File | null>(null)

    const [form, setForm] = useState<ProfileFormState>({
        name: '',
        experience_years: '',
        price_per_hour: '',
        approach: '',
        about: '',
        certificates: [],
        topics: [],
    })

    const handleFieldChange: OnFieldChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = () => {}

    return (
        <div className="specialist-profile-settings">
            <Header variant="page" />

            <main className="specialist-profile-settings__content">
                <Container className="specialist-profile-settings__container">
                    <BackButton />

                    <h1 className="specialist-profile-settings__title">Налаштування профілю</h1>

                    <form className="specialist-profile-settings__form" onSubmit={handleSubmit}>
                        <section className="specialist-profile-settings__section">
                            <h2 className="specialist-profile-settings__section-title">Мої дані</h2>

                            <div className="specialist-profile-settings__section-content specialist-profile-settings__section-content--my-data">
                                <AvatarUploader onChange={setAvatarFile} />
                                <PersonalDataCard
                                    values={{
                                        name: form.name,
                                        experience_years: form.experience_years,
                                        price_per_hour: form.price_per_hour,
                                        approach: form.approach,
                                    }}
                                    onChange={handleFieldChange}
                                />
                            </div>
                        </section>

                        <section className="specialist-profile-settings__section">
                            <h2 className="specialist-profile-settings__section-title">
                                Основна інформація
                            </h2>

                            <div className="specialist-profile-settings__section-content specialist-profile-settings__section-content--basic-inf">
                                <div className="specialist-profile-settings__region-about">
                                    <AboutField
                                        value={form.about}
                                        onChange={(value) => handleFieldChange('about', value)}
                                    />
                                    <EducationList
                                        value={form.certificates}
                                        onChange={(value) =>
                                            handleFieldChange('certificates', value)
                                        }
                                    />
                                </div>
                                <TopicsPicker
                                    value={form.topics}
                                    onChange={(value) => handleFieldChange('topics', value)}
                                />
                            </div>
                        </section>

                        <div className="specialist-profile-settings__actions">
                            <button
                                type="submit"
                                className="specialist-profile-settings__save-button"
                            >
                                Зберегти зміни
                            </button>
                        </div>
                    </form>
                </Container>
            </main>

            <AiChat />

            <Footer variant="page" />
        </div>
    )
}
