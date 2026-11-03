import classNames from 'classnames'
import type { ReactNode } from 'react'

import './Tab.scss'

type Props = {
    className?: string
    onClick: () => void
    isActive: boolean
    children: ReactNode
}

export const Tab = ({ className, isActive, onClick, children }: Props) => {
    return (
        <button
            className={classNames('tab', className, {
                'tab--active': isActive,
            })}
            onClick={onClick}
        >
            {children}
        </button>
    )
}
