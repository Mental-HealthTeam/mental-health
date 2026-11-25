import { useTranslation } from 'react-i18next'

import type { SymptomCode } from '../../types/psychologist'

import { Avatar } from '../UI/Avatar'
import { OutlineButton } from '../UI/Buttons'

import { ClientProfileCardSkeleton } from './ClientProfileCardSkeleton'

import './ClientProfileCard.scss'

export type ClientRequest = {
    code: SymptomCode
    isActive?: boolean
}

type Props = {
    isLoading: boolean
    name: string | null
    email: string
    telegram: string | null
    avatarUrl: string | null
    requests: ClientRequest[]
    onEditProfile: () => void
}

export const ClientProfileCard = ({
    isLoading,
    name,
    email,
    telegram,
    avatarUrl,
    requests,
    onEditProfile,
}: Props) => {
    const { t } = useTranslation(['clientCabinet', 'symptoms'])

    if (isLoading) {
        return <ClientProfileCardSkeleton />
    }

    const displayName = name?.trim() || t('clientCabinet:profile.defaultName')
    const telegramUsername = telegram?.trim().replace(/^@/, '') || null

    return (
        <section className="client-profile-card" aria-labelledby="client-profile-name">
            <div className="client-profile-card__photo">
                <Avatar
                    src={avatarUrl}
                    alt={displayName}
                    shape="rectangle"
                    fluid
                    className="client-profile-card__avatar"
                />
            </div>

            <div className="client-profile-card__content">
                <div className="client-profile-card__identity">
                    <h2 className="client-profile-card__name" id="client-profile-name">
                        {displayName}
                    </h2>

                    <p className="client-profile-card__email">{email}</p>

                    {telegramUsername && (
                        <a
                            className="client-profile-card__telegram"
                            href={`https://t.me/${encodeURIComponent(telegramUsername)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            @{telegramUsername}
                        </a>
                    )}
                </div>

                <div className="client-profile-card__requests">
                    <h3 className="client-profile-card__requests-title">
                        {t('clientCabinet:profile.requests')}
                    </h3>

                    {requests.length > 0 ? (
                        <ul className="client-profile-card__tags">
                            {requests.map(({ code, isActive }) => (
                                <li
                                    key={code}
                                    className={
                                        isActive
                                            ? 'client-profile-card__tag client-profile-card__tag--active'
                                            : 'client-profile-card__tag'
                                    }
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
                    <OutlineButton type="button" variant="secondary" onClick={onEditProfile}>
                        {t('clientCabinet:profile.edit')}
                    </OutlineButton>
                </div>
            </div>
        </section>
    )
}
