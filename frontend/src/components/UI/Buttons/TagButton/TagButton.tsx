import type { ButtonHTMLAttributes, ReactNode } from 'react'
import classNames from 'classnames'

import './TagButton.scss'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    children: ReactNode
    variant?: 'black' | 'green'
    reverse?: boolean
    isSelected?: boolean
    endIcon?: ReactNode
}

export const TagButton = ({
    children,
    variant = 'black',
    reverse = false,
    isSelected = false,
    endIcon,
    className,
    type = 'button',
    ...props
}: Props) => (
    <button
        {...props}
        className={classNames(
            'tag-button',
            `tag-button--${variant}`,
            {
                'tag-button--reverse': reverse,
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
