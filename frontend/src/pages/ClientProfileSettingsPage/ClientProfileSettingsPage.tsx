import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Container } from '../../components/Container'
import type { ClientProfileValues } from '../../components/ClientProfileForm'
import { ClientProfileForm } from '../../components/ClientProfileForm'

import './ClientProfileSettingsPage.scss'
import { BackButton } from '../../components/UI/Buttons/BackButton'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

const previewValues: ClientProfileValues = {
    name: 'Ангеліна Квіткова',
    email: 'deadpool@gmail.com',
    telegram: '',
    topics: [],
    notifications: false,
}

export const ClientProfileSettingsPage = () => {
    const { t } = useTranslation('clientProfileSettings')

    const [isDirty, setIsDirty] = useState(false)
    const [isPreviewChecked, setIsPreviewChecked] = useState(false)

    useEffect(() => {
        if (!isDirty) {
            return
        }

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault()
            event.returnValue = ''
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [isDirty])

    return (
        <div className="client-profile-settings-page">
            <Header variant={'page'} />
            <main className="client-profile-settings-page__main">
                <Container className="client-profile-settings-page__container">
                    <BackButton className="client-profile-settings-page__back" />

                    <h1 className="client-profile-settings-page__title">{t('title')}</h1>

                    <ClientProfileForm
                        initialValues={previewValues}
                        onDirtyChange={setIsDirty}
                        onSubmit={async () => {
                            setIsPreviewChecked(true)
                        }}
                    />

                    {isPreviewChecked && (
                        <p className="client-profile-settings-page__notice" role="status">
                            {t('previewNotice')}
                        </p>
                    )}
                </Container>
            </main>
            <Footer />
        </div>
    )
}
