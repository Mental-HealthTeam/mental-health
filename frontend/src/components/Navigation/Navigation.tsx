import classNames from 'classnames'
import { useTranslation } from 'react-i18next'

import { navigationItems } from '../../constants/navigation'

import './Navigation.scss'

type Props = {
    className?: string
    onNavigate?: () => void
}

export const Navigation = ({ className, onNavigate }: Props) => {
    const { t } = useTranslation('navigation')

    return (
        <nav className={classNames('navigation', className)} aria-label={t('ariaLabel')}>
            {navigationItems.map(({ key, href }) => (
                <a className="navigation__link" href={href} key={href} onClick={onNavigate}>
                    {t(key)}
                </a>
            ))}
        </nav>
    )
}
