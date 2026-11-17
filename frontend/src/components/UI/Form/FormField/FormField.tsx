import type { InputHTMLAttributes } from 'react'
import './FormField.scss'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
}

export const FormField = ({ label, id, ...inputProps }: FormFieldProps) => {
  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={id}>
        {label}
      </label>

      <input
        id={id}
        className="form-field__input"
        {...inputProps}
      />
    </div>
  )
}
