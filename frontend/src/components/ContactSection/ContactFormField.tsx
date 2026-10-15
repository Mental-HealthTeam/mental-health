import type { ContactFormFieldName } from './types'

type Props = {
    name: ContactFormFieldName
    label: string
    placeholder: string
    value: string
    error?: string
    multiline?: boolean
    autoComplete?: string
    onChange: (field: ContactFormFieldName, value: string) => void
}

export const ContactFormField = ({
    name,
    label,
    placeholder,
    value,
    error,
    multiline = false,
    autoComplete,
    onChange,
}: Props) => {
    const fieldId = `contact-${name}`
    const errorId = `${fieldId}-error`

    const fieldClassName = `contact-section__input ${
        multiline ? 'contact-section__textarea' : ''
    } ${error ? 'contact-section__input--error' : ''}`

    return (
        <div className="contact-section__field">
            <label className="contact-section__field-label" htmlFor={fieldId}>
                {label}
            </label>

            {multiline ? (
                <textarea
                    className={fieldClassName}
                    id={fieldId}
                    name={name}
                    value={value}
                    placeholder={placeholder}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                    onChange={(event) => onChange(name, event.target.value)}
                />
            ) : (
                <input
                    className={fieldClassName}
                    id={fieldId}
                    name={name}
                    type="text"
                    value={value}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                    onChange={(event) => onChange(name, event.target.value)}
                />
            )}

            <span
                className={`contact-section__error ${
                    error ? 'contact-section__error--visible' : ''
                }`}
                id={errorId}
                aria-live="polite"
            >
                {error ?? ''}
            </span>
        </div>
    )
}
