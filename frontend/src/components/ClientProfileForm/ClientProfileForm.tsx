import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { PrimaryButton } from '../UI/Buttons'

import { clientProfileSchema } from './clientProfile.schema'

import type {
    ClientProfileErrors,
    ClientProfileSubmit,
    ClientProfileValues,
    ClientTextField,
} from './clientProfile.types'

import './ClientProfileForm.scss'
import { useAvatar } from '../../hooks'
import { ClientPersonalFields } from './ClientPersonalFields'
import { ClientAvatarField } from './ClientAvatarField'
import { ClientTopicsField } from './ClientTopicsField'

export type { ClientProfileSubmit, ClientProfileValues } from './clientProfile.types'

type Props = {
    initialValues: ClientProfileValues
    avatarUrl?: string | null
    onSubmit: (values: ClientProfileSubmit) => Promise<void>
    onDirtyChange: (isDirty: boolean) => void
}

export const ClientProfileForm = ({
    initialValues,
    avatarUrl = null,
    onSubmit,
    onDirtyChange,
}: Props) => {
    const { t } = useTranslation('clientProfileSettings')
    const titleId = useId()

    const [values, setValues] = useState<ClientProfileValues>(() => ({
        ...initialValues,
        topics: [...new Set(initialValues.topics)],
    }))
    const [errors, setErrors] = useState<ClientProfileErrors>({})
    const [isSaving, setIsSaving] = useState(false)

    const submittingRef = useRef(false)
    const avatar = useAvatar(avatarUrl)

    const initialTopics = new Set(initialValues.topics)

    const isDirty =
        avatar.isDirty ||
        values.name !== initialValues.name ||
        values.email !== initialValues.email ||
        values.telegram !== initialValues.telegram ||
        values.notifications !== initialValues.notifications ||
        values.topics.length !== initialTopics.size ||
        values.topics.some((code) => !initialTopics.has(code))

    useEffect(() => {
        onDirtyChange(isDirty)
    }, [isDirty, onDirtyChange])

    const updateField = (field: ClientTextField, value: string) => {
        setValues((previous) => ({
            ...previous,
            [field]: value,
        }))

        setErrors((previous) => ({
            ...previous,
            [field]: undefined,
            submit: undefined,
        }))
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (submittingRef.current || avatar.isValidating || avatar.error) {
            return
        }

        const result = clientProfileSchema.safeParse(values)

        if (!result.success) {
            const nextErrors: ClientProfileErrors = {}

            for (const issue of result.error.issues) {
                const field = issue.path[0]

                if (field === 'name' || field === 'email' || field === 'telegram') {
                    nextErrors[field] = t(`errors.${field}`)
                }
            }

            setErrors(nextErrors)
            return
        }

        submittingRef.current = true
        setIsSaving(true)
        setErrors({})

        try {
            await onSubmit({
                ...values,
                ...result.data,
                avatarFile: avatar.avatarFile,
                removeAvatar: avatar.removeAvatar,
            })
        } catch {
            setErrors({ submit: t('errors.save') })
        } finally {
            submittingRef.current = false
            setIsSaving(false)
        }
    }

    return (
        <form
            className="client-profile-form"
            noValidate
            aria-busy={isSaving || avatar.isValidating}
            onSubmit={handleSubmit}
        >
            <fieldset className="client-profile-form__fieldset" disabled={isSaving}>
                <section className="client-profile-form__panel" aria-labelledby={titleId}>
                    <h2 className="client-profile-form__title" id={titleId}>
                        {t('personalData')}
                    </h2>

                    <div className="client-profile-form__data">
                        <ClientAvatarField avatar={avatar} />

                        <ClientPersonalFields
                            values={values}
                            errors={errors}
                            onChange={updateField}
                        />
                    </div>
                </section>

                <ClientTopicsField
                    selectedTopics={values.topics}
                    onChange={(topics) => {
                        setValues((previous) => ({
                            ...previous,
                            topics,
                        }))
                        setErrors((previous) => ({
                            ...previous,
                            submit: undefined,
                        }))
                    }}
                />

                <div className="client-profile-form__footer">
                    <label className="client-profile-form__consent">
                        <input
                            type="checkbox"
                            checked={values.notifications}
                            onChange={(event) => {
                                const notifications = event.target.checked

                                setValues((previous) => ({
                                    ...previous,
                                    notifications,
                                }))
                                setErrors((previous) => ({
                                    ...previous,
                                    submit: undefined,
                                }))
                            }}
                        />

                        <span>{t('notifications')}</span>
                    </label>

                    {errors.submit && (
                        <p className="client-profile-form__error" role="alert">
                            {errors.submit}
                        </p>
                    )}

                    <PrimaryButton
                        className="client-profile-form__save"
                        type="submit"
                        disabled={isSaving || avatar.isValidating || Boolean(avatar.error)}
                    >
                        {isSaving ? t('saving') : t('save')}
                    </PrimaryButton>
                </div>
            </fieldset>
        </form>
    )
}
