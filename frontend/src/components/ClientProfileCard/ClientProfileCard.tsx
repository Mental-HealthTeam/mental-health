import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AvatarFallbackIcon } from '../UI/Icons'

import './ClientProfileCard.scss'
import type { SymptomCode } from '../../types/psychologist.ts'
import { OutlineButton } from '../UI/Buttons'

export type ClientRequest = {
    code: SymptomCode
    isActive?: boolean
}

type Props = {
    name: string | null
    email: string
    avatarUrl: string | null
    requests: ClientRequest[]
    onEditProfile: () => void
}

export const ClientProfileCard = ({ name, email, avatarUrl, requests, onEditProfile }: Props) => {
    const { t } = useTranslation(['clientCabinet', 'symptoms'])
    const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null)

    const hasAvatar = Boolean(avatarUrl) && avatarUrl !== failedAvatarUrl

    return (
        <section className="client-profile-card" aria-labelledby="client-profile-name">
            <div className="client-profile-card__photo">
                {hasAvatar && avatarUrl ? (
                    <img
                        className="client-profile-card__image"
                        src={avatarUrl}
                        alt=""
                        onError={() => setFailedAvatarUrl(avatarUrl)}
                    />
                ) : (
                    <span className="client-profile-card__fallback" aria-hidden="true">
                        <AvatarFallbackIcon />
                    </span>
                )}
            </div>

            <div className="client-profile-card__content">
                <div className="client-profile-card__identity">
                    <h2 className="client-profile-card__name" id="client-profile-name">
                        {name?.trim() || t('clientCabinet:profile.defaultName')}
                    </h2>

                    <p className="client-profile-card__email">{email}</p>
                </div>

                <div className="client-profile-card__requests">
                    <h3 className="client-profile-card__requests-title">
                        {t('clientCabinet:profile.requests')}
                    </h3>

                    {requests.length > 0 ? (
                        <ul className="client-profile-card__tags">
                            {requests.map(({ code, isActive }) => (
                                <li
                                    className={
                                        isActive
                                            ? 'client-profile-card__tag client-profile-card__tag--active'
                                            : 'client-profile-card__tag'
                                    }
                                    key={code}
                                >
                                    {t(`symptoms:${code}.title`)}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="client-profile-card__empty">
                            {t('clientCabinet:profile.noRequests')}
                        </p>
                    )}
                </div>

                <div className="client-profile-card__actions">
                    <OutlineButton variant="secondary" onClick={onEditProfile}>
                        {t('clientCabinet:profile.edit')}
                    </OutlineButton>
                </div>
            </div>
        </section>
    )
}
