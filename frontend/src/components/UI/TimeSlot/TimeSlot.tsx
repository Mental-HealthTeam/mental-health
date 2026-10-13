import classNames from 'classnames'

import { RadioButton } from '../RadioButton'

import './TimeSlot.scss'

type Props = {
    label: string
    value: string
    checked: boolean
    disabled?: boolean
    name?: string
    className?: string
    onChange: (value: string) => void
}

export const TimeSlot = ({
    label,
    value,
    checked,
    disabled = false,
    name = 'time-slot',
    className,
    onChange,
}: Props) => {
    return (
        <label
            className={classNames(
                'time-slot',
                {
                    'time-slot--checked': checked,
                    'time-slot--disabled': disabled,
                },
                className,
            )}
        >
            <RadioButton
                checked={checked}
                disabled={disabled}
                name={name}
                value={value}
                onChange={onChange}
            />

            <span className="time-slot__label">{label}</span>
        </label>
    )
}
