import type { ButtonHTMLAttributes, ReactNode } from 'react'

import './PrimaryButton.scss'

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode
    startIcon?: ReactNode
    endIcon?: ReactNode
    fullWidth?: boolean
}

export const PrimaryButton = ({
    children,
    startIcon,
    endIcon,
    fullWidth = false,
    className = '',
    type = 'button',
    ...props
}: PrimaryButtonProps) => {
    const classes = ['primary-button', fullWidth && 'primary-button--full-width', className]
        .filter(Boolean)
        .join(' ')

    return (
        <button className={classes} type={type} {...props}>
            {startIcon && (
                <span className="primary-button__icon" aria-hidden="true">
                    {startIcon}
                </span>
            )}

            <span className="primary-button__text">{children}</span>

            {endIcon && (
                <span className="primary-button__icon" aria-hidden="true">
                    {endIcon}
                </span>
            )}
        </button>
    )
}
