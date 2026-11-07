import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { useGetSymptomCodesQuery } from '../../services/psychologistsApi'
import type { SymptomCode } from '../../types/psychologist'

import { OutlineButton, PrimaryButton } from '../UI/Buttons'
import { AvatarFallbackIcon } from '../UI/Icons'

import './ClientProfileForm.scss'

export type ClientProfileValues = {
    name: string
    email: string
    telegram: string
    topics: SymptomCode[]
    notifications: boolean
}

export type ClientProfileSubmit = ClientProfileValues & {
    avatarFile: File | null
    removeAvatar: boolean
}

type Props = {
    initialValues: ClientProfileValues
    avatarUrl?: string | null
    onSubmit: (values: ClientProfileSubmit) => Promise<void>
    onDirtyChange: (isDirty: boolean) => void
}

type TextField = 'name' | 'email' | 'telegram'

type FormErrors = Partial<Record<TextField | 'avatar' | 'submit', string>>

const profileSchema = z.object({
    name: z.string().trim().min(1).max(255),
    email: z.string().trim().email(),
    telegram: z
        .string()
        .trim()
        .refine((value) => value === '' || /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(value)),
})

const fields: TextField[] = ['name', 'email', 'telegram']
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxImageSize = 5 * 1024 * 1024

export const ClientProfileForm = ({
    initialValues,
    avatarUrl = null,
    onSubmit,
    onDirtyChange,
}: Props) => {
    const { t } = useTranslation('clientProfileSettings')
    const { t: tSymptoms } = useTranslation('symptoms')

    const {
        data: topicCodes = [],
        isLoading: isTopicsLoading,
        isFetching: isTopicsFetching,
        isError: isTopicsError,
        refetch: refetchTopics,
    } = useGetSymptomCodesQuery()

    const [values, setValues] = useState<ClientProfileValues>(() => ({
        ...initialValues,
        topics: [...new Set(initialValues.topics)],
    }))
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [removeAvatar, setRemoveAvatar] = useState(false)
    const [failedImage, setFailedImage] = useState<string | null>(null)
    const [errors, setErrors] = useState<FormErrors>({})
    const [isSaving, setIsSaving] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const submittingRef = useRef(false)

    const imageSrc = previewUrl || (removeAvatar ? null : avatarUrl)
    const hasAvatar = Boolean(imageSrc)
    const availableTopics = topicCodes.filter((code) => !values.topics.includes(code))

    const initialTopics = new Set(initialValues.topics)

    const isDirty =
        avatarFile !== null ||
        (removeAvatar && Boolean(avatarUrl)) ||
        values.name !== initialValues.name ||
        values.email !== initialValues.email ||
        values.telegram !== initialValues.telegram ||
        values.notifications !== initialValues.notifications ||
        values.topics.length !== initialTopics.size ||
        values.topics.some((code) => !initialTopics.has(code))

    useEffect(() => {
        onDirtyChange(isDirty)
    }, [isDirty, onDirtyChange])

    useEffect(() => {
        if (!previewUrl) {
            return
        }

        return () => URL.revokeObjectURL(previewUrl)
    }, [previewUrl])

    const updateField = (field: TextField, value: string) => {
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

    const addTopic = (code: SymptomCode) => {
        setValues((previous) => ({
            ...previous,
            topics: previous.topics.includes(code) ? previous.topics : [...previous.topics, code],
        }))

        setErrors((previous) => ({
            ...previous,
            submit: undefined,
        }))
    }

    const removeTopic = (code: SymptomCode) => {
        setValues((previous) => ({
            ...previous,
            topics: previous.topics.filter((topic) => topic !== code),
        }))

        setErrors((previous) => ({
            ...previous,
            submit: undefined,
        }))
    }

    const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]

        event.target.value = ''

        if (!file) {
            return
        }

        if (!allowedImageTypes.includes(file.type)) {
            setErrors((previous) => ({
                ...previous,
                avatar: t('errors.imageType'),
            }))
            return
        }

        if (file.size === 0 || file.size > maxImageSize) {
            setErrors((previous) => ({
                ...previous,
                avatar: t('errors.imageSize'),
            }))
            return
        }

        setAvatarFile(file)
        setPreviewUrl(URL.createObjectURL(file))
        setRemoveAvatar(false)
        setFailedImage(null)

        setErrors((previous) => ({
            ...previous,
            avatar: undefined,
            submit: undefined,
        }))
    }

    const handleAvatarRemove = () => {
        setAvatarFile(null)
        setPreviewUrl(null)
        setRemoveAvatar(Boolean(avatarUrl))
        setFailedImage(null)

        setErrors((previous) => ({
            ...previous,
            avatar: undefined,
            submit: undefined,
        }))
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (submittingRef.current) {
            return
        }

        const result = profileSchema.safeParse(values)

        if (!result.success) {
            const nextErrors: FormErrors = {}

            for (const issue of result.error.issues) {
                const field = issue.path[0]

                if (field === 'name') {
                    nextErrors.name = t('errors.name')
                } else if (field === 'email') {
                    nextErrors.email = t('errors.email')
                } else if (field === 'telegram') {
                    nextErrors.telegram = t('errors.telegram')
                }
            }

            setErrors((previous) => ({
                avatar: previous.avatar,
                ...nextErrors,
            }))
            return
        }

        if (errors.avatar) {
            setErrors({ avatar: errors.avatar })
            return
        }

        submittingRef.current = true
        setIsSaving(true)
        setErrors({})

        try {
            await onSubmit({
                ...values,
                ...result.data,
                avatarFile,
                removeAvatar,
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
            aria-busy={isSaving}
            onSubmit={handleSubmit}
        >
            <fieldset className="client-profile-form__fieldset" disabled={isSaving}>
                <section
                    className="client-profile-form__panel"
                    aria-labelledby="profile-data-title"
                >
                    <h2 className="client-profile-form__title" id="profile-data-title">
                        {t('personalData')}
                    </h2>

                    <div className="client-profile-form__data">
                        <div className="client-profile-form__avatar">
                            <div className="client-profile-form__photo">
                                {imageSrc && imageSrc !== failedImage ? (
                                    <img
                                        key={imageSrc}
                                        src={imageSrc}
                                        alt=""
                                        onError={() => {
                                            setFailedImage(imageSrc)

                                            if (previewUrl === imageSrc) {
                                                setErrors((previous) => ({
                                                    ...previous,
                                                    avatar: t('errors.imageInvalid'),
                                                }))
                                            }
                                        }}
                                    />
                                ) : (
                                    <AvatarFallbackIcon />
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                className="client-profile-form__file"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                aria-label={t('addPhoto')}
                                onChange={handleAvatarChange}
                            />

                            <div className="client-profile-form__photo-actions">
                                <PrimaryButton
                                    type="button"
                                    fullWidth
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {hasAvatar ? t('changePhoto') : t('addPhoto')}
                                </PrimaryButton>

                                {hasAvatar && (
                                    <OutlineButton
                                        type="button"
                                        fullWidth
                                        onClick={handleAvatarRemove}
                                    >
                                        {t('deletePhoto')}
                                    </OutlineButton>
                                )}
                            </div>

                            {errors.avatar && (
                                <p className="client-profile-form__error" role="alert">
                                    {errors.avatar}
                                </p>
                            )}
                        </div>

                        <div className="client-profile-form__fields">
                            {fields.map((field) => (
                                <div className="client-profile-form__field" key={field}>
                                    <label htmlFor={`client-${field}`}>{t(field)}</label>

                                    <input
                                        id={`client-${field}`}
                                        name={field}
                                        type={field === 'email' ? 'email' : 'text'}
                                        autoComplete={field === 'telegram' ? 'off' : field}
                                        autoCapitalize={field === 'name' ? 'words' : 'none'}
                                        spellCheck={false}
                                        placeholder={field === 'telegram' ? 'username' : undefined}
                                        value={values[field]}
                                        maxLength={field === 'name' ? 255 : undefined}
                                        required={field !== 'telegram'}
                                        aria-invalid={Boolean(errors[field])}
                                        aria-describedby={
                                            errors[field] ? `client-${field}-error` : undefined
                                        }
                                        onChange={(event) => updateField(field, event.target.value)}
                                    />

                                    {errors[field] && (
                                        <p
                                            className="client-profile-form__error"
                                            id={`client-${field}-error`}
                                            role="alert"
                                        >
                                            {errors[field]}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section
                    className="client-profile-form__panel"
                    aria-labelledby="profile-topics-title"
                    aria-busy={isTopicsFetching}
                >
                    <h2 className="client-profile-form__title" id="profile-topics-title">
                        {t('topicsTitle')}
                    </h2>

                    {values.topics.length > 0 && (
                        <div className="client-profile-form__topic-group">
                            <h3 className="client-profile-form__hint">{t('myTopics')}</h3>

                            <ul className="client-profile-form__topics">
                                {values.topics.map((code) => {
                                    const label = tSymptoms(`${code}.title` as const)

                                    return (
                                        <li key={code}>
                                            <button
                                                className="client-profile-form__topic client-profile-form__topic--selected"
                                                type="button"
                                                aria-label={t('removeTopic', {
                                                    topic: label,
                                                })}
                                                onClick={() => removeTopic(code)}
                                            >
                                                <span>{label}</span>
                                                <span
                                                    className="client-profile-form__topic-remove"
                                                    aria-hidden="true"
                                                >
                                                    ×
                                                </span>
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}

                    {(isTopicsLoading || isTopicsError || availableTopics.length > 0) && (
                        <div className="client-profile-form__topic-group">
                            <h3 className="client-profile-form__hint">{t('topicsHint')}</h3>

                            {isTopicsLoading && (
                                <p className="client-profile-form__hint" role="status">
                                    {t('topicsLoading')}
                                </p>
                            )}

                            {isTopicsError && (
                                <div className="client-profile-form__topics-error" role="alert">
                                    <p className="client-profile-form__error">
                                        {t('topicsLoadError')}
                                    </p>

                                    <PrimaryButton
                                        type="button"
                                        disabled={isTopicsFetching}
                                        onClick={() => void refetchTopics()}
                                    >
                                        {t('retry')}
                                    </PrimaryButton>
                                </div>
                            )}

                            <ul className="client-profile-form__topics">
                                {availableTopics.map((code) => (
                                    <li key={code}>
                                        <button
                                            className="client-profile-form__topic"
                                            type="button"
                                            onClick={() => addTopic(code)}
                                        >
                                            {tSymptoms(`${code}.title` as const)}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>

                <div className="client-profile-form__footer">
                    <label className="client-profile-form__consent">
                        <input
                            type="checkbox"
                            checked={values.notifications}
                            onChange={(event) => {
                                const checked = event.target.checked

                                setValues((previous) => ({
                                    ...previous,
                                    notifications: checked,
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
                        disabled={isSaving}
                    >
                        {isSaving ? t('saving') : t('save')}
                    </PrimaryButton>
                </div>
            </fieldset>
        </form>
    )
}
