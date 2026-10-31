import classNames from 'classnames'
import type { ReactNode } from 'react'

import './InfoTile.scss'

type Props = {
    className?: string
    icon: ReactNode
    label: string
    value: string
}

export const InfoTile = ({ className, icon, label, value }: Props) => {
    return (
        <li className={classNames('info-tile', className)}>
            <span className="info-tile__icon" aria-hidden="true">
                {icon}
            </span>
            <div className="info-tile__content">
                <span className="info-tile__label">{label}</span>
                <span className="info-tile__value">{value}</span>
            </div>
        </li>
    )
}
