import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import type {
    ClientProfileErrors,
    ClientProfileValues,
    ClientTextField,
} from '../clientProfile.types'

import './ClientPersonalFields.scss'

type Props = {
    values: ClientProfileValues
    errors: ClientProfileErrors
    onChange: (field: ClientTextField, value: string) => void
}

const fields: ClientTextField[] = ['name', 'email', 'telegram']

export const ClientPersonalFields = ({ values, errors, onChange }: Props) => {
    const { t } = useTranslation('clientProfileSettings')
    const id = useId()

    return (
        <div className="client-profile-form__fields">
            {fields.map((field) => {
                const inputId = `${id}-${field}`
                const errorId = `${inputId}-error`
                const isEmail = field === 'email'

                return (
                    <div className="client-profile-form__field" key={field}>
                        <label htmlFor={inputId}>{t(field)}</label>

                        <input
                            id={inputId}
                            name={field}
                            type={isEmail ? 'email' : 'text'}
                            autoComplete={field === 'telegram' ? 'off' : field}
                            autoCapitalize={field === 'name' ? 'words' : 'none'}
                            spellCheck={false}
                            placeholder={field === 'telegram' ? 'username' : undefined}
                            value={values[field]}
                            maxLength={field === 'name' ? 255 : undefined}
                            required={field !== 'telegram'}
                            readOnly={isEmail}
                            title={isEmail ? t('emailReadOnlyHint') : undefined}
                            aria-invalid={Boolean(errors[field])}
                            aria-describedby={errors[field] ? errorId : undefined}
                            onChange={(event) => {
                                if (!isEmail) {
                                    onChange(field, event.target.value)
                                }
                            }}
                        />

                        {errors[field] && (
                            <p className="client-profile-form__error" id={errorId} role="alert">
                                {errors[field]}
                            </p>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
