import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PrimaryButton } from '../UI/Buttons'
import { ArrowIcon } from '../UI/Icons'

import { ContactFormField } from './ContactFormField'
import { CONTACT_FORM_FIELDS } from './contactFormFields'
import { validateContactForm } from './contactFormValidation'

import type {
    ContactFormErrors,
    ContactFormFieldName,
    ContactFormValidationMessages,
    ContactFormValues,
} from './types'

const INITIAL_VALUES: ContactFormValues = {
    name: '',
    contact: '',
    message: '',
}

export const ContactForm = () => {
    const { t } = useTranslation('contact')

    const [values, setValues] = useState<ContactFormValues>(INITIAL_VALUES)

    const [errors, setErrors] = useState<ContactFormErrors>({})

    const handleFieldChange = (field: ContactFormFieldName, value: string) => {
        setValues((currentValues) => ({
            ...currentValues,
            [field]: value,
        }))

        setErrors((currentErrors) => ({
            ...currentErrors,
            [field]: undefined,
        }))
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const validationMessages: ContactFormValidationMessages = {
            nameRequired: t('form.errors.nameRequired'),
            nameInvalid: t('form.errors.nameInvalid'),
            contactRequired: t('form.errors.contactRequired'),
            contactInvalid: t('form.errors.contactInvalid'),
            messageRequired: t('form.errors.messageRequired'),
            messageInvalid: t('form.errors.messageInvalid'),
        }

        const nextErrors = validateContactForm(values, validationMessages)

        setErrors(nextErrors)

        if (Object.keys(nextErrors).length > 0) {
            return
        }
    }

    return (
        <div className="contact-section__form-wrapper">
            <h3 className="contact-section__form-title">{t('form.title')}</h3>

            <p className="contact-section__form-description">{t('form.description')}</p>

            <form className="contact-section__form" onSubmit={handleSubmit} noValidate>
                {CONTACT_FORM_FIELDS.map((field) => (
                    <ContactFormField
                        key={field.name}
                        name={field.name}
                        label={t(field.labelKey)}
                        placeholder={t(field.placeholderKey)}
                        value={values[field.name]}
                        error={errors[field.name]}
                        multiline={field.multiline}
                        autoComplete={field.autoComplete}
                        onChange={handleFieldChange}
                    />
                ))}

                <PrimaryButton
                    className="contact-section__submit"
                    type="submit"
                    fullWidth
                    endIcon={<ArrowIcon />}
                >
                    {t('form.submit')}
                </PrimaryButton>

                <p className="contact-section__privacy">{t('form.privacy')}</p>
            </form>
        </div>
    )
}
