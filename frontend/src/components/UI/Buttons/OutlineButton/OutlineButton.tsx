import type { ButtonHTMLAttributes, ReactNode } from 'react'
import classNames from 'classnames'

import './OutlineButton.scss'

type OutlineButtonVariant = 'secondary' | 'tertiary'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    children: ReactNode
    variant?: OutlineButtonVariant
    fullWidth?: boolean
    startIcon?: ReactNode
    endIcon?: ReactNode
}

export const OutlineButton = ({
    children,
    variant = 'secondary',
    fullWidth = false,
    startIcon,
    endIcon,
    className,
    type = 'button',
    ...props
}: Props) => (
    <button
        className={classNames(
            'outline-button',
            `outline-button--${variant}`,
            {
                'outline-button--full-width': fullWidth,
            },
            className,
        )}
        type={type}
        {...props}
    >
        {startIcon && (
            <span className="outline-button__icon" aria-hidden="true">
                {startIcon}
            </span>
        )}

        <span className="outline-button__text">{children}</span>

        {endIcon && (
            <span className="outline-button__icon" aria-hidden="true">
                {endIcon}
            </span>
        )}
    </button>
)
