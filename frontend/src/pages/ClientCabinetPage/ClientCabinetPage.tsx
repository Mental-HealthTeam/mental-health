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

export const ClientCabinetPage = () => {
    const { t } = useTranslation('clientCabinet')
    const navigate = useNavigate()

    const { data: profile, isLoading, isError, refetch } = useClientProfileQuery()

    const requests: ClientRequest[] = (profile?.topics ?? []).map((code) => ({
        code,
        isActive: true,
    }))

    return (
        <div className="client-cabinet-page">
            <Header variant="page" />

            <main className="client-cabinet-page__main">
                <Container className="client-cabinet-page__container">
                    <BackButton className="client-cabinet-page__back" />

                    <h1 className="client-cabinet-page__title">{t('title')}</h1>

                    <div className="client-cabinet-page__sections">
                        {isLoading && !profile && <p role="status">{t('profile.loading')}</p>}

                        {isError && (
                            <div role="alert">
                                <p>{t('profile.loadError')}</p>
                                <button type="button" onClick={() => void refetch()}>
                                    {t('profile.retry')}
                                </button>
                            </div>
                        )}

                        {profile && !isError && (
                            <ClientProfileCard
                                name={profile.name}
                                email={profile.email}
                                telegram={profile.telegram}
                                avatarUrl={profile.avatar_url}
                                requests={requests}
                                onEditProfile={() => navigate('/cabinet/settings')}
                            />
                        )}

                        <ClientSessionsTable />
                    </div>
                </Container>
            </main>

            <Footer variant="page" />
            <AiChat />
        </div>
    )
}
