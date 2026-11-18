import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBlocker, useNavigate } from 'react-router-dom'

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
    const navigate = useNavigate()

    const [initialProfile] = useState(user)
    const [isDirty, setIsDirty] = useState(false)

    const allowLeaveRef = useRef(false)
    const confirmationShownRef = useRef(false)

    const [updateProfile] = useUpdateProfileMutation()
    const [uploadAvatar] = useUploadAvatarMutation()
    const [deleteAvatar] = useDeleteAvatarMutation()

    const blocker = useBlocker(() => isDirty && !allowLeaveRef.current)

    useEffect(() => {
        if (blocker.state === 'unblocked') {
            confirmationShownRef.current = false
            return
        }

        if (blocker.state !== 'blocked' || confirmationShownRef.current) {
            return
        }

        confirmationShownRef.current = true

        if (window.confirm(t('unsavedChangesConfirm'))) {
            blocker.proceed()
        } else {
            blocker.reset()
        }
    }, [blocker, t])

    useEffect(() => {
        if (!isDirty) return

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (allowLeaveRef.current) return

            event.preventDefault()
            event.returnValue = ''
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [isDirty])

    const handleSubmit = async (values: ClientProfileSubmit) => {
        await updateProfile({
            name: values.name,
        }).unwrap()

        if (values.avatarFile) {
            await uploadAvatar(values.avatarFile).unwrap()
        } else if (values.removeAvatar) {
            await deleteAvatar().unwrap()
        }

        allowLeaveRef.current = true
        setIsDirty(false)
        navigate('/cabinet', { replace: true })
    }

    return (
        <>
            <p className="client-profile-settings-page__notice">{t('supportedFieldsNotice')}</p>

            <ClientProfileForm
                initialValues={getInitialValues(initialProfile)}
                avatarUrl={initialProfile.avatar_url}
                onDirtyChange={setIsDirty}
                onSubmit={handleSubmit}
            />
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

                    {isLoading && !user && <p role="status">{t('loading')}</p>}

                    {isError && !user && <p role="alert">{t('loadError')}</p>}

                    {user && <ProfileEditor key={user.id} user={user} />}
                </Container>
            </main>

            <Footer variant="page" />
        </div>
    )
}
