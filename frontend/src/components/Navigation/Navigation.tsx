import classNames from 'classnames'
import { useTranslation } from 'react-i18next'

import { type NavigationItem } from '../../constants/navigation'

import './Navigation.scss'

type Props = {
    items: NavigationItem[]
    className?: string
    onNavigate?: () => void
}

export const Navigation = ({ className, onNavigate, items }: Props) => {
    const { t } = useTranslation('navigation')

    return (
        <nav className={classNames('navigation', className)} aria-label={t('ariaLabel')}>
            {items.map(({ key, href }) => (
                <a className="navigation__link" href={href} key={href} onClick={onNavigate}>
                    {t(key)}
                </a>
            ))}
        </nav>
    )
}
