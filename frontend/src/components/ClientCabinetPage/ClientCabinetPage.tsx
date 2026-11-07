import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useAppDispatch } from '../../app/hooks'
import { openAiChat } from '../../app/store/slices/aiChatSlice'
import { AiChat } from '../AiChat'
import { ClientProfileCard } from '../ClientProfileCard'
import type { ClientRequest } from '../ClientProfileCard'
import { ClientSessions } from '../ClientSessions'
import { Container } from '../Container'
import { BackButton } from '../UI/Buttons/BackButton'

import './ClientCabinetPage.scss'

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
    const dispatch = useAppDispatch()

    const language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'uk'

    return (
        <div className="client-cabinet-page">
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

                        <ClientSessions
                            onStartAiSearch={() => dispatch(openAiChat())}
                            onOpenCatalog={() => navigate('/#psychologists')}
                        />
                    </div>
                </Container>
            </main>

            <AiChat />
        </div>
    )
}
