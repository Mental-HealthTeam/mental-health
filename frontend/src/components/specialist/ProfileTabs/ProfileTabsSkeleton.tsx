import classNames from 'classnames'

import { Skeleton } from '../../UI/Skeleton'

import './ProfileTabs.scss'

type Props = {
    className?: string
}

export const ProfileTabsSkeleton = ({ className }: Props) => (
    <div className={classNames('profile-tabs', className)} aria-hidden="true">
        <div className="profile-tabs__panel">
            <div className="profile-tabs__basic-information">
                <div className="profile-tabs__about-card">
                    <Skeleton
                        className="profile-tabs__card-skeleton"
                        width="100%"
                        height={180}
                        radius={24}
                    />
                </div>

                <div className="profile-tabs__education-card">
                    <Skeleton
                        className="profile-tabs__card-skeleton"
                        width="100%"
                        height={220}
                        radius={24}
                    />
                </div>

                <div className="profile-tabs__specializations">
                    <Skeleton
                        className="profile-tabs__card-skeleton"
                        width="100%"
                        height={140}
                        radius={24}
                    />
                </div>
            </div>
        </div>
    </div>
)
