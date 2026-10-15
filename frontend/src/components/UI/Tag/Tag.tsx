import type { ReactNode } from 'react'
import './Tag.scss'

type Props = {
    children: ReactNode
    className?: string
}

export const Tag = ({ children, className }: Props) => (
    <div className={`tag ${className}`}>{children}</div>
)
