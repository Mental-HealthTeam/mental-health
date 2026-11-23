import { useTranslation } from 'react-i18next'

import { Skeleton } from '../UI/Skeleton'

import './ClientProfileCard.scss'

export const ClientProfileCardSkeleton = () => {
    const { t } = useTranslation('clientCabinet')

    return (
        <div role="status">
            <span className="client-profile-card__loading-label">{t('profile.loading')}</span>

            <Skeleton className="client-profile-card__skeleton" width="100%" radius={24} />
        </div>
    )
}
