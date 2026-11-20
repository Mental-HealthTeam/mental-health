import {
    useCallback,
    useLayoutEffect,
    useRef,
    type InputHTMLAttributes,
    type TextareaHTMLAttributes,
} from 'react'
import './FormField.scss'

type BaseProps = {
    label: string
    id: string
    error?: string
}

type InputVariantProps = BaseProps &
    InputHTMLAttributes<HTMLInputElement> & {
        variant?: 'input'
    }

type TextareaVariantProps = BaseProps &
    TextareaHTMLAttributes<HTMLTextAreaElement> & {
        variant: 'textarea'
    }

type FormFieldProps = InputVariantProps | TextareaVariantProps

const AutoResizeTextarea = ({
    value,
    onInput,
    ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) => {
    const ref = useRef<HTMLTextAreaElement>(null)

    const resize = useCallback(() => {
        const el = ref.current
        if (!el) return

        el.style.height = 'auto'
        const border = el.offsetHeight - el.clientHeight
        el.style.height = `${el.scrollHeight + border}px`
    }, [])

    useLayoutEffect(() => {
        resize()
    }, [value, resize])

    const handleInput: TextareaHTMLAttributes<HTMLTextAreaElement>['onInput'] = (e) => {
        resize()
        onInput?.(e)
    }

    return <textarea ref={ref} rows={1} value={value} onInput={handleInput} {...rest} />
}

export const FormField = (props: FormFieldProps) => {
    const { label, id, error } = props
    const errorId = `${id}-error`

    const commonProps = {
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? errorId : undefined,
    }

    const renderControl = () => {
        if (props.variant === 'textarea') {
            const {
                variant: _variant,
                label: _label,
                id: _id,
                error: _error,
                ...textareaProps
            } = props

            return (
                <AutoResizeTextarea
                    className="form-field__input form-field__input--textarea"
                    {...commonProps}
                    {...textareaProps}
                />
            )
        }

        const { variant: _variant, label: _label, id: _id, error: _error, ...inputProps } = props

        return <input className="form-field__input" {...commonProps} {...inputProps} />
    }

    return (
        <div className="form-field">
            <label className="form-field__label" htmlFor={id}>
                {label}
            </label>

            {renderControl()}

            {error && (
                <p className="form-field__error" id={errorId} role="alert">
                    {error}
                </p>
            )}
        </div>
    )
}
