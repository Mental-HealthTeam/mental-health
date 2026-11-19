import type { InputHTMLAttributes } from "react"
import './FormField.scss'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string
    id: string
    error?: string
}

export const FormField = ({ label, id, error, ...inputProps }: FormFieldProps) => {
    const errorId = `${id}-error`

    return (
        <div className="form-field">
            <label className="form-field__label" htmlFor={id}>{label}</label>
            <input
                id={id}
                className="form-field__input"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                {...inputProps}
            />
            {error && (
                <p className="form-field__error" id={errorId} role="alert">
                    {error}
                </p>
            )}
        </div>
    )
}