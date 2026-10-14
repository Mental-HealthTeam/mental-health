import type { ReactNode } from 'react'
import './SectionLabel.scss'

type Props = {
    children: string
    startIcon?: ReactNode
    id?: string
    variant?: 'default' | 'light'
    className?: string
}

export const SectionLabel = ({ children, startIcon, id, variant = 'default', className }: Props) => (
    <div className="section-label" id={id}>
        {startIcon && (
            <span
                className={`section-label__icon section-label__icon--${variant} ${className}`}
                aria-hidden="true"
            >
                {startIcon}
            </span>
        )}

        <span className="section-label__text">{children}</span>
    </div>
)
