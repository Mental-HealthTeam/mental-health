import classNames from 'classnames'
import type { ReactNode } from 'react'

import './InfoTile.scss'

type Props = {
    as?: 'li' | 'div'
    className?: string
    icon: ReactNode
    label: ReactNode
    value: string
}

export const InfoTile = ({ as: Tile = 'li', className, icon, label, value }: Props) => {
    return (
        <Tile className={classNames('info-tile', className)}>
            <span className="info-tile__icon" aria-hidden="true">
                {icon}
            </span>
            <div className="info-tile__content">
                <span className="info-tile__label">{label}</span>
                <span className="info-tile__value">{value}</span>
            </div>
        </Tile>
    )
}
