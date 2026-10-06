import classNames from 'classnames'

import './RadioButton.scss'

type Props = {
    checked: boolean
    disabled?: boolean
    name?: string
    value?: string
    ariaLabel?: string
    className?: string
    onChange?: (value: string) => void
}

export const RadioButton = ({
    checked,
    disabled = false,
    name,
    value = '',
    ariaLabel,
    className,
    onChange,
}: Props) => {
    const handleChange = () => {
        if (disabled) {
            return
        }

        onChange?.(value)
    }

    return (
        <label
            className={classNames(
                'radio-button',
                {
                    'radio-button--checked': checked,
                    'radio-button--disabled': disabled,
                },
                className,
            )}
        >
            <input
                className="radio-button__input"
                type="radio"
                name={name}
                value={value}
                checked={checked}
                disabled={disabled}
                aria-label={ariaLabel}
                onChange={handleChange}
            />

            <span className="radio-button__control" aria-hidden="true" />
        </label>
    )
}
