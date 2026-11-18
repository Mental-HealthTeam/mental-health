import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useClientProfileQuery } from '../../services/clientCabinetApi'

import './ClientCabinetPage.scss'
import { AiChat } from '../../components/AiChat'
import { ClientProfileCard, type ClientRequest } from '../../components/ClientProfileCard'
import { Header } from '../../components/Header'
import { Container } from '../../components/Container'
import { BackButton } from '../../components/UI/Buttons'
import { ClientSessionsTable } from '../../components/Catalog/ClientSessionsTable'
import { Footer } from '../../components/Footer'

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

    const { data: profile } = useClientProfileQuery()

    const language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'uk'

    const name = profile ? profile.name : previewClient.names[language]
    const avatarUrl = profile ? profile.avatar_url : previewClient.avatarUrl

    return (
        <div className="client-cabinet-page">
            <Header variant="page" />

            <main className="client-cabinet-page__main">
                <Container className="client-cabinet-page__container">
                    <BackButton className="client-cabinet-page__back" />

                    <h1 className="client-cabinet-page__title">{t('title')}</h1>

                    <div className="client-cabinet-page__sections">
                        <ClientProfileCard
                            name={name}
                            email={previewClient.email}
                            avatarUrl={avatarUrl}
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
