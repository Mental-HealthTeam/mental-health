import { Skeleton } from '../UI/Skeleton'

import './SpecialistCard.scss'

export const SpecialistCardSkeleton = () => (
    <article className="specialist-card specialist-card--skeleton" aria-hidden="true">
        <header className="specialist-card__header">
            <Skeleton variant="circle" width={74} height={74} className="specialist-card__avatar" />

            <div className="specialist-card__identity" style={{ flex: 1 }}>
                <Skeleton variant="text" width="min(144px, 100%)" height={22} />
                <Skeleton width="min(88px, 100%)" height={24} radius={6} />
            </div>
        </header>

        <div className="specialist-card__stats">
            <div className="specialist-card__stat">
                <Skeleton
                    variant="circle"
                    width={36}
                    height={36}
                    className="specialist-card__stat-icon"
                />

                <div className="specialist-card__stat-content" style={{ flex: 1 }}>
                    <Skeleton variant="text" width="min(60px, 100%)" height={17} />
                    <Skeleton variant="text" width="min(64px, 100%)" height={19} />
                </div>
            </div>

            <div className="specialist-card__stat">
                <Skeleton
                    variant="circle"
                    width={36}
                    height={36}
                    className="specialist-card__stat-icon"
                />

                <div className="specialist-card__stat-content" style={{ flex: 1 }}>
                    <Skeleton variant="text" width="min(90px, 100%)" height={17} />
                    <Skeleton variant="text" width="min(68px, 100%)" height={19} />
                </div>
            </div>
        </div>

        <section className="specialist-card__topics">
            <Skeleton variant="text" width={125} height={19} />

            <div className="specialist-card__topic-list" style={{ width: '100%' }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 6,
                        width: '100%',
                    }}
                >
                    <Skeleton width={85} height={32} radius={8} />
                    <Skeleton width={105} height={32} radius={8} />
                </div>

                <Skeleton width={140} height={32} radius={8} />
            </div>
        </section>

        <div className="specialist-card__actions">
            <Skeleton width="100%" height={40} radius={10} />
            <Skeleton width="100%" height={42} radius={10} />
        </div>
    </article>
)
