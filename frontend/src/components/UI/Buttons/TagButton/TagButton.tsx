import type { ButtonHTMLAttributes, ReactNode } from 'react'
import classNames from 'classnames'

import './TagButton.scss'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    children: ReactNode
    size?: 'large' | 'medium'
    isSelected?: boolean
    endIcon?: ReactNode
}

export const TagButton = ({
    children,
    size = 'large',
    isSelected,
    endIcon,
    className,
    type = 'button',
    ...props
}: Props) => (
    <button
        {...props}
        className={classNames(
            'tag-button',
            `tag-button--${size}`,
            {
                'tag-button--selected': isSelected,
            },
            className,
        )}
        type={type}
        aria-pressed={isSelected}
    >
        <span className="tag-button__text">{children}</span>

        {endIcon && (
            <span className="tag-button__icon" aria-hidden="true">
                {endIcon}
            </span>
        )}
    </button>
)
