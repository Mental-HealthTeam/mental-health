import { useTranslation } from 'react-i18next'
import { SpecialistAvatarField } from './SpecialistAvatarField'
import type {
    SpecialistProfileSubmit,
    SpecialistProfileValues,
    SpecialistTextField,
} from './specialistProfile.types'
import { SpecialistTopicsField } from './SpecialistTopicsField/SpecialistTopicsField'
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
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
    const [isSaving, setIsSaving] = useState(false)

    const [invalidFields, setInvalidFields] = useState<(keyof SpecialistProfileErrors)[]>([])
    const [hasSubmitError, setHasSubmitError] = useState(false)

    const errors = useMemo<SpecialistProfileErrors>(() => {
        const result: SpecialistProfileErrors = {}

        for (const field of invalidFields) {
            result[field] = t(`errors.${field}`)
        }

        if (hasSubmitError) {
            result.submit = t('errors.submit')
        }

        return result
    }, [invalidFields, hasSubmitError, t])

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
        setInvalidFields((previous) => previous.filter((item) => item !== field))
        setHasSubmitError(false)
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
            setInvalidFields(getInvalidFields(result.error))
            return
        }

        submittingRef.current = true
        setIsSaving(true)
        setInvalidFields([])
        setHasSubmitError(false)

        try {
            await onSubmit({
                ...result.data,
                avatarFile: avatar.avatarFile,
                removeAvatar: avatar.removeAvatar,
            })
        } catch {
            setHasSubmitError(true)
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
                            errors={errors}
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
