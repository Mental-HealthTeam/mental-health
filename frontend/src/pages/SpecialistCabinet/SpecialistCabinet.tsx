import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { Container } from '../../components/Container'
import { AiChat } from '../../components/AiChat'
import { SpecialistProfileCard } from '../../components/specialist/SpecialistProfileCard'
import { ProfileTabs } from '../../components/specialist/ProfileTabs'
import { MySessions } from './components/MySessions'
import { OutlineButton } from '../../components/UI/Buttons'
import { BackButton } from '../../components/UI/Buttons/BackButton'

import './SpecialistCabinet.scss'
import { useGetPsychologistMeQuery } from '../../services/psychologistsApi'
import { useMeQuery } from '../../services/authApi'

export const SpecialistCabinet = () => {
    const navigate = useNavigate()
    const { t, i18n } = useTranslation(['specialistCabinet'])
    const {
        data: profile,
        isError: isErrorPsychologist,
        isLoading: isLoadingPsychologist,
    } = useGetPsychologistMeQuery({ lang: i18n.language })
    const { data: me } = useMeQuery()

    const specialist = useMemo(
        () =>
            profile && me
                ? {
                      ...profile,
                      full_name: me.name ?? '',
                      avatar_url: me.avatar_url,
                      session_minutes: profile.session_minutes ?? 50,
                  }
                : undefined,
        [profile, me],
    )

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [])

    return (
        <div className="specialist-cabinet">
            <Header />

            <main className="specialist-cabinet__content">
                <Container className="specialist-cabinet__container">
                    <BackButton />

                    {isLoadingPsychologist && <p>{t('loading')}</p>}
                    {isErrorPsychologist && <p role="alert">{t('loadError')}</p>}
                    {specialist && (
                        <>
                            <h1 className="specialist-cabinet__title">{t('title')}</h1>

                            <SpecialistProfileCard
                                className="specialist-cabinet__specialist-card"
                                specialist={specialist}
                                actions={
                                    <OutlineButton
                                        className="specialist-cabinet__button"
                                        variant="secondary"
                                        fullWidth
                                        onClick={() => navigate('/specialist/settings/profile')}
                                    >
                                        {t('settingsProfile')}
                                    </OutlineButton>
                                }
                            />

                            <ProfileTabs
                                className="specialist-cabinet__profile-tabs"
                                specialist={specialist}
                            />

                            <MySessions className="specialist-cabinet__my-sessions" />
                        </>
                    )}
                </Container>
            </main>

            <Footer />

            <AiChat />
        </div>
    )
}
