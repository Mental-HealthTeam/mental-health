import classNames from 'classnames'

import { Avatar } from '../UI/Avatar'
import { VerifiedBadge } from '../UI/VerifiedBadge'

import './SpecialistIdentity.scss'

type Props = {
    name: string
    avatarUrl?: string | null
    isVerified: boolean
    isLoading?: boolean
    nameId?: string
    nameAs?: 'h2' | 'h3' | 'strong'
    className?: string
}

export const SpecialistIdentity = ({
    name,
    avatarUrl,
    isVerified,
    isLoading = false,
    nameId,
    nameAs: Name = 'strong',
    className,
}: Props) => (
    <div className={classNames('specialist-identity', className)} aria-busy={isLoading}>
        <Avatar src={avatarUrl ?? undefined} alt="" size="large" isLoading={isLoading} />

        <div className="specialist-identity__details">
            <Name className="specialist-identity__name" id={nameId}>
                {name}
            </Name>

            {isVerified && !isLoading && <VerifiedBadge />}
        </div>
    </div>
)
