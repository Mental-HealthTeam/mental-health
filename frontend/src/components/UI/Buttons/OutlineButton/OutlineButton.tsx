import type { ButtonHTMLAttributes, ReactNode } from 'react'

import classNames from 'classnames'

import './OutlineButton.scss'

type OutlineButtonVariant = 'secondary' | 'tertiary'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    children: ReactNode
    variant?: OutlineButtonVariant
    fullWidth?: boolean
}

export const OutlineButton = ({
    children,
    variant = 'secondary',
    fullWidth = false,
    className,
    type = 'button',
    ...props
}: Props) => {
    return (
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
            {children}
        </button>
    )
}
