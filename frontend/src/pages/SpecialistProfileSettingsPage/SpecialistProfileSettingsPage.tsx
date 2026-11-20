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
    useMeQuery,
    useUpdateProfileMutation,
    useUploadAvatarMutation,
} from '../../services/authApi'
import { useTranslation } from 'react-i18next'

import type { SpecialistProfile, UpdateProfileBody } from '../../types/specialist'
import { useBlocker, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useGetSpecialistMeQuery, useUpdateSpecialistProfileMutation } from '../../services/specialistProfileApi'
import { localizeProfile } from '../../utils/localizeProfile'

type ProfileEditorProps = {
    specialist: SpecialistProfile
}

const getInitialValues = (specialist: SpecialistProfile): SpecialistProfileValues => ({
    name: specialist.full_name ?? '',
    experience_years: specialist.experience_years?.toString() ?? '',
    price_per_hour: specialist.price_per_hour?.toString() ?? '',
    approach: specialist.bio.approach ?? '',
    about: specialist.bio.about ?? '',
    certificates: specialist.certificates ?? [],
    topics: specialist.topics ?? [],
})

const ProfileEditor = ({ specialist }: ProfileEditorProps) => {
    const { t } = useTranslation('specialistProfileSettings')
    const navigate = useNavigate()

    const [initialProfile] = useState(specialist)
    const [isDirty, setIsDirty] = useState(false)

    const allowLeaveRef = useRef(false)
    const confirmationShownRef = useRef(false)

    const [updateSpecialistProfile] = useUpdateSpecialistProfileMutation()
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

    const [updateMe] = useUpdateProfileMutation()

    const handleSubmit = async (values: SpecialistProfileSubmit) => {
        const body: UpdateProfileBody = {
            bio: {
                about: values.about,
                approach: values.approach,
                scope: initialProfile.bio?.scope ?? '',
            },
            experience_years: values.experience_years,
            price_per_hour: values.price_per_hour,
            certificates: values.certificates,
            topics: values.topics,
        }

        await updateSpecialistProfile(body).unwrap()

        if (values.name !== (initialProfile.full_name ?? '')) {
            await updateMe({ name: values.name }).unwrap()
        }

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
    const { t, i18n } = useTranslation('specialistProfileSettings')

    const {
        data: profile,
        isError: isErrorPsychologist,
        isLoading: isLoadingPsychologist,
    } = useGetSpecialistMeQuery({ lang: i18n.language })
    const { data: me } = useMeQuery()

    const specialist = useMemo(() => {
        if (!profile || !me) return undefined

        return {
            ...localizeProfile(profile, i18n.language),
            full_name: me.name ?? '',
            avatar_url: me.avatar_url,
            session_minutes: profile.session_minutes ?? 50,
        }
    }, [profile, me, i18n.language])

    return (
        <div className="specialist-profile-settings">
            <Header variant="page" />

            <main className="specialist-profile-settings__main">
                <Container className="specialist-profile-settings__container">
                    <BackButton className="specialist-profile-settings__back" />

                    <h1 className="specialist-profile-settings__title">{t('title')}</h1>

                    {isLoadingPsychologist && !specialist && <p role="status">{t('loading')}</p>}

                    {isErrorPsychologist && !specialist && <p role="alert">{t('loadError')}</p>}

                    {specialist && (
                        <ProfileEditor key={specialist.psychologist_id} specialist={specialist} />
                    )}
                </Container>
            </main>

            <AiChat />

            <Footer variant="page" />
        </div>
    )
}
