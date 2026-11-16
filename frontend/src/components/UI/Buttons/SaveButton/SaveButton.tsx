import type { ButtonHTMLAttributes } from 'react'
import classNames from 'classnames'

import './SaveButton.scss'

type Props = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'aria-pressed' | 'aria-label'
> & {
    isSaved?: boolean
    'aria-label': string
}

export const SaveButton = ({
    isSaved = false,
    className,
    type = 'button',
    'aria-label': ariaLabel,
    ...props
}: Props) => (
    <button
        {...props}
        type={type}
        className={classNames('save-button', { 'save-button--saved': isSaved }, className)}
        aria-label={ariaLabel}
        aria-pressed={isSaved}
    >
        <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <path
                d="M24.4032 13.6617V24.2323C24.4032 25.5815 23.4127 26.1491 22.2032 25.4978L18.4603 23.46C18.0603 23.2459 17.4127 23.2459 17.0127 23.46L13.2698 25.4978C12.0603 26.1491 11.0698 25.5815 11.0698 24.2323V13.6617C11.0698 12.0705 12.4031 10.7678 14.0317 10.7678H21.4413C23.0698 10.7678 24.4032 12.0705 24.4032 13.6617Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    </button>
)
