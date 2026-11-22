import classNames from 'classnames'

import { RadioButton } from '../RadioButton'

import './TimeSlot.scss'

type BaseProps = {
    label: string
    className?: string
}

type SelectableProps = BaseProps & {
    value: string
    checked: boolean
    disabled?: boolean
    name?: string
    onChange: (value: string) => void
    status?: never
}

type StatusProps = BaseProps & {
    status: 'active' | 'expired'
    value?: never
    checked?: never
    disabled?: never
    name?: never
    onChange?: never
}

type Props = SelectableProps | StatusProps

export const TimeSlot = (props: Props) => {
    if (props.status) {
        const { label, status, className } = props

        return (
            <span
                className={classNames(
                    'time-slot',
                    'time-slot--status',
                    `time-slot--${status}`,
                    className,
                )}
            >
                <span className="time-slot__status-icon" aria-hidden="true" />

                <span className="time-slot__label">{label}</span>
            </span>
        )
    }

    const {
        label,
        value,
        checked,
        disabled = false,
        name = 'time-slot',
        className,
        onChange,
    } = props

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
