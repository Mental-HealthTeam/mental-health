import { Container } from '../../components/Container'
import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { BackButton } from '../../components/UI/Buttons'
import './SpecialistProfileSettingsPage.scss'
import { AiChat } from '../../components/AiChat'
import { SpecialistProfileForm } from '../../components/SpecialistProfileForm/SpecialistProfileForm'
import type {
    SpecialistProfileSubmit,
    SpecialistProfileValues,
} from '../../components/SpecialistProfileForm/specialistProfile.types'
import {
    useDeleteAvatarMutation,
    useUpdateProfileMutation,
    useUploadAvatarMutation,
} from '../../services/authApi'
import { useTranslation } from 'react-i18next'

import type { SpecialistMe } from '../../types/specialist'
import { useBlocker, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useGetSpecialistMeQuery } from '../../services/specialistProfileApi'

type ProfileEditorProps = {
    specialist: SpecialistMe
}

const getInitialValues = (specialist: SpecialistMe): SpecialistProfileValues => ({
    name: specialist.name ?? '',
    experience_years: specialist.experience_years?.toString() ?? '',
    price_per_hour: specialist.price_per_hour?.toString() ?? '',
    approach: specialist.approach ?? '',
    about: specialist.about ?? '',
    certificates: specialist.certificates ?? [],
    topics: specialist.topics ?? [],
})

const ProfileEditor = ({ specialist }: ProfileEditorProps) => {
    const { t } = useTranslation('clientProfileSettings')
    const navigate = useNavigate()

    const [initialProfile] = useState(specialist)
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

    const handleSubmit = async (values: SpecialistProfileSubmit) => {
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
        navigate('/specialist/cabinet', { replace: true })
    }

    return (
        <>
            <p className="specialist-profile-settings__notice">{t('supportedFieldsNotice')}</p>

            <SpecialistProfileForm
                initialValues={getInitialValues(initialProfile)}
                avatarUrl={initialProfile.avatar_url}
                onDirtyChange={setIsDirty}
                onSubmit={handleSubmit}
            />
        </>
    )
}

export const SpecialistProfileSettingsPage = () => {
    const { t } = useTranslation('specialistProfileSettings')

    const { data: specialist, isLoading, isError } = useGetSpecialistMeQuery()

    return (
        <div className="specialist-profile-settings">
            <Header variant="page" />

            <main className="specialist-profile-settings__main">
                <Container className="specialist-profile-settings__container">
                    <BackButton className="specialist-profile-settings__back" />

                    <h1 className="specialist-profile-settings__title">{t('title')}</h1>

                    {isLoading && !specialist && <p role="status">{t('loading')}</p>}

                    {isError && !specialist && <p role="alert">{t('loadError')}</p>}

                    {specialist && <ProfileEditor key={specialist.id} specialist={specialist} />}
                </Container>
            </main>

            <AiChat />

            <Footer variant="page" />
        </div>
    )
}
