import { Skeleton } from '../UI/Skeleton'

import './SpecialistCard.scss'

export const SpecialistCardSkeleton = () => (
    <article className="specialist-card specialist-card--skeleton" aria-hidden="true">
        <div className="specialist-card__header">
            <Skeleton variant="circle" className="specialist-card__skeleton-avatar" />

            <div className="specialist-card__identity">
                <Skeleton variant="text" width={160} height={22} />
                <Skeleton width={80} height={24} radius={6} />
            </div>
        </div>

        <div className="specialist-card__stats">
            <div className="specialist-card__stat">
                <Skeleton variant="circle" width={36} height={36} />

                <div className="specialist-card__stat-content">
                    <Skeleton variant="text" width={65} height={14} />
                    <Skeleton variant="text" width={75} height={18} />
                </div>
            </div>

            <div className="specialist-card__stat">
                <Skeleton variant="circle" width={36} height={36} />

                <div className="specialist-card__stat-content">
                    <Skeleton variant="text" width={95} height={14} />
                    <Skeleton variant="text" width={75} height={18} />
                </div>
            </div>
        </div>

        <div className="specialist-card__topics">
            <Skeleton variant="text" width={125} height={18} />

            <div className="specialist-card__topic-list">
                <Skeleton width={85} height={32} radius={8} />
                <Skeleton width={105} height={32} radius={8} />
            </div>
        </div>

        <div className="specialist-card__actions">
            <Skeleton width="100%" height={44} radius={10} />
            <Skeleton width="100%" height={44} radius={10} />
        </div>
    </article>
)
