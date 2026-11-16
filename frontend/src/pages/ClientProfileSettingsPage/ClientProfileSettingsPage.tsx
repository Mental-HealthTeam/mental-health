import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Container } from '../../components/Container'
import {
    ClientProfileForm,
    type ClientProfileSubmit,
    type ClientProfileValues,
} from '../../components/ClientProfileForm'
import { BackButton } from '../../components/UI/Buttons'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'

import {
    useMeQuery,
    useUpdateProfileMutation,
    useUploadAvatarMutation,
    useDeleteAvatarMutation,
} from '../../services/authApi'
import type { UserPublic } from '../../types/auth'

import './ClientProfileSettingsPage.scss'

type ProfileEditorProps = {
    user: UserPublic
}

const getInitialValues = (user: UserPublic): ClientProfileValues => ({
    name: user.name ?? '',
    email: user.email,
    telegram: '',
    topics: [],
    notifications: false,
})

const ProfileEditor = ({ user }: ProfileEditorProps) => {
    const { t } = useTranslation('clientProfileSettings')

    const [savedProfile, setSavedProfile] = useState(user)
    const [formVersion, setFormVersion] = useState(0)
    const [isDirty, setIsDirty] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    const [updateProfile] = useUpdateProfileMutation()
    const [uploadAvatar] = useUploadAvatarMutation()
    const [deleteAvatar] = useDeleteAvatarMutation()

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

    const handleDirtyChange = (dirty: boolean) => {
        setIsDirty(dirty)

        if (dirty) {
            setIsSaved(false)
        }
    }

    const handleSubmit = async (values: ClientProfileSubmit) => {
        setIsSaved(false)

        let updatedProfile = savedProfile

        updatedProfile = await updateProfile({
            name: values.name,
        }).unwrap()

        if (values.avatarFile) {
            updatedProfile = await uploadAvatar(values.avatarFile).unwrap()
        } else if (values.removeAvatar) {
            updatedProfile = await deleteAvatar().unwrap()
        }

        setSavedProfile(updatedProfile)
        setIsDirty(false)
        setIsSaved(true)
        setFormVersion((current) => current + 1)
    }

    return (
        <>
            <p className="client-profile-settings-page__notice">{t('supportedFieldsNotice')}</p>

            <ClientProfileForm
                key={formVersion}
                initialValues={getInitialValues(savedProfile)}
                avatarUrl={savedProfile.avatar_url}
                onDirtyChange={handleDirtyChange}
                onSubmit={handleSubmit}
            />

            {isSaved && (
                <p className="client-profile-settings-page__notice" role="status">
                    {t('saveSuccess')}
                </p>
            )}
        </>
    )
}

export const ClientProfileSettingsPage = () => {
    const { t } = useTranslation('clientProfileSettings')

    const { data: user, isLoading, isError } = useMeQuery()

    return (
        <div className="client-profile-settings-page">
            <Header variant="page" />

            <main className="client-profile-settings-page__main">
                <Container className="client-profile-settings-page__container">
                    <BackButton className="client-profile-settings-page__back" />

                    <h1 className="client-profile-settings-page__title">{t('title')}</h1>

                    {isLoading && <p role="status">{t('loading')}</p>}

                    {isError && <p role="alert">{t('loadError')}</p>}

                    {!isLoading && !isError && user && <ProfileEditor key={user.id} user={user} />}
                </Container>
            </main>

            <Footer />
        </div>
    )
}
