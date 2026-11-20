import { useTranslation } from 'react-i18next'
import { Avatar } from '../UI/Avatar'
import { OutlineButton } from '../UI/Buttons'

import type { SymptomCode } from '../../types/psychologist'

import './ClientProfileCard.scss'

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

    return (
        <section className="client-profile-card" aria-labelledby="client-profile-name">
            <div className="client-profile-card__photo">
                <Avatar
                    src={avatarUrl}
                    alt={name?.trim() || t('clientCabinet:profile.defaultName')}
                    shape="rectangle"
                    fluid
                    className="client-profile-card__avatar"
                />
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
