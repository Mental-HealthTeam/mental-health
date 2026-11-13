import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { AiChat } from '../AiChat'
import { ClientProfileCard } from '../ClientProfileCard'
import type { ClientRequest } from '../ClientProfileCard'

import { Container } from '../Container'
import { BackButton } from '../UI/Buttons'

import './ClientCabinetPage.scss'
import { ClientSessionsTable } from '../Catalog/ClientSessionsTable'
import { Header } from '../Header'
import { Footer } from '../Footer'

const previewClient = {
    names: {
        uk: 'Ангеліна Квіткова',
        en: 'Anhelina Kvitkova',
    },
    email: 'deadpool@gmail.com',
    avatarUrl: null,
}

const previewRequests: ClientRequest[] = [
    { code: 'anxiety', isActive: true },
    { code: 'stress' },
    { code: 'relationship' },
    { code: 'low_mood' },
    { code: 'self_esteem' },
    { code: 'burnout' },
]

export const ClientCabinetPage = () => {
    const { t, i18n } = useTranslation('clientCabinet')
    const navigate = useNavigate()

    const language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'uk'

    return (
        <div className="client-cabinet-page">
            <Header variant={'page'} />
            <main className="client-cabinet-page__main">
                <Container className="client-cabinet-page__container">
                    <BackButton className="client-cabinet-page__back" />

                    <h1 className="client-cabinet-page__title">{t('title')}</h1>

                    <div className="client-cabinet-page__sections">
                        <ClientProfileCard
                            name={previewClient.names[language]}
                            email={previewClient.email}
                            avatarUrl={previewClient.avatarUrl}
                            requests={previewRequests}
                            onEditProfile={() => navigate('/cabinet/settings')}
                        />

                        <ClientSessionsTable />
                    </div>
                </Container>
            </main>
            <Footer variant="page" />
            <AiChat />
        </div>
    )
}
