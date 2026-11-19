import { useTranslation } from 'react-i18next'
import { SpecialistAvatarField } from './SpecialistAvatarField'
import type {
    SpecialistProfileSubmit,
    SpecialistProfileValues,
    SpecialistTextField,
} from './specialistProfile.types'
import { SpecialistTopicsField } from './SpecialistTopicsField/SpecialistTopicsField'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
    getInvalidFields,
    specialistProfileSchema,
    type SpecialistProfileErrors,
} from './specialistProfile.schema'
import { useAvatar } from '../../hooks'
import { PrimaryButton } from '../UI/Buttons'
import { SpecialistAboutFields } from './SpecialistAboutFields'
import { SpecialistPersonalFields } from './SpecialistPersonalFields'

import './SpecialistProfileForm.scss'

type Props = {
    initialValues: SpecialistProfileValues
    avatarUrl?: string | null
    onSubmit: (values: SpecialistProfileSubmit) => Promise<void>
    onDirtyChange: (isDirty: boolean) => void
}

const isSameValues = (a: SpecialistProfileValues, b: SpecialistProfileValues) =>
    JSON.stringify(a) === JSON.stringify(b)

export const SpecialistProfileForm = ({
    initialValues,
    avatarUrl = null,
    onSubmit,
    onDirtyChange,
}: Props) => {
    const { t } = useTranslation('specialistProfileSettings')
    const personalTitleId = useId()
    const infoTitleId = useId()

    const [values, setValues] = useState<SpecialistProfileValues>(() => ({
        ...initialValues,
        topics: [...new Set(initialValues.topics)],
    }))
    const [errors, setErrors] = useState<SpecialistProfileErrors>({})
    const [isSaving, setIsSaving] = useState(false)

    const submittingRef = useRef(false)
    const avatar = useAvatar(avatarUrl)

    const isDirty = avatar.isDirty || !isSameValues(values, initialValues)

    useEffect(() => {
        onDirtyChange(isDirty)
    }, [isDirty, onDirtyChange])

    const updateField = <K extends keyof SpecialistProfileValues>(
        field: K,
        value: SpecialistProfileValues[K],
    ) => {
        setValues((previous) => ({ ...previous, [field]: value }))
        setErrors((previous) => ({
            ...previous,
            [field]: undefined,
            submit: undefined,
        }))
    }

    const updateTextField = (field: SpecialistTextField, value: string) => {
        updateField(field, value)
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (submittingRef.current || avatar.isValidating || avatar.error) {
            return
        }

        const result = specialistProfileSchema.safeParse(values)

        if (!result.success) {
            const nextErrors: SpecialistProfileErrors = {}

            for (const field of getInvalidFields(result.error)) {
                nextErrors[field] = t(`errors.${field}`)
            }

            setErrors(nextErrors)
            return
        }

        submittingRef.current = true
        setIsSaving(true)
        setErrors({})

        try {
            await onSubmit({
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
            className="specialist-profile-form"
            noValidate
            aria-busy={isSaving || avatar.isValidating}
            onSubmit={handleSubmit}
        >
            <fieldset className="specialist-profile-form__fieldset" disabled={isSaving}>
                <section
                    className="specialist-profile-form__section"
                    aria-labelledby={personalTitleId}
                >
                    <h2 className="specialist-profile-form__section-title" id={personalTitleId}>
                        {t('personalData')}
                    </h2>

                    <div className="specialist-profile-form__section-content specialist-profile-form__section-content--my-data">
                        <SpecialistAvatarField avatar={avatar} />

                        <SpecialistPersonalFields
                            values={values}
                            errors={errors}
                            onChange={updateTextField}
                        />
                    </div>
                </section>

                <section className="specialist-profile-form__section" aria-labelledby={infoTitleId}>
                    <h2 className="specialist-profile-form__section-title" id={infoTitleId}>
                        {t('mainInfo')}
                    </h2>

                    <div className="specialist-profile-form__section-content specialist-profile-form__section-content--basic-inf">
                        <SpecialistAboutFields
                            about={values.about}
                            certificates={values.certificates}
                            errors={errors}
                            onAboutChange={(about) => updateField('about', about)}
                            onCertificatesChange={(certificates) =>
                                updateField('certificates', certificates)
                            }
                        />

                        <SpecialistTopicsField
                            selectedTopics={values.topics}
                            onChange={(topics) => updateField('topics', topics)}
                            className="specialist-profile-form__topics-field"
                        />
                    </div>
                </section>

                <div className="specialist-profile-form__actions">
                    <PrimaryButton
                        className="specialist-profile-form__save"
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
