import classNames from 'classnames'
import { useTranslation } from 'react-i18next'

import './VerifiedBadge.scss'

type Props = {
    className?: string
}

export const VerifiedBadge = ({ className }: Props) => {
    const { t } = useTranslation('common')

    return <span className={classNames('verified-badge', className)}>{t('badges.verified')}</span>
}
