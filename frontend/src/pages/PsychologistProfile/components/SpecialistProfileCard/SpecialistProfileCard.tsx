import classNames from 'classnames'

import './SpecialistProfileCard.scss'
import { InfoTile } from '../../../../components/InfoTile'
import { LearnIcon } from '../../../../components/UI/Icons/WhyChoosePlatform'
import { ClockCardIcon, MoneyIcon } from '../../../../components/UI/Icons'
import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { SpecialistProfile } from '../../../../types/specialist'
import defaultPhoto from '../../../../assets/images/specialist-photo.png'

type Props = {
    specialist: SpecialistProfile
    actions: ReactNode
    className?: string
}

export const SpecialistProfileCard = ({ className, specialist, actions }: Props) => {
    const { t } = useTranslation([
        'psychologists',
        'symptoms',
        'accessibility',
        'specialistProfile',
    ])

    return (
        <section className={classNames('profile-card', className)}>
            <img
                className="profile-card__photo"
                src={specialist.avatar_url ? specialist.avatar_url : defaultPhoto}
                alt=""
            />

            <div className="profile-card__heading">
                {specialist?.is_verified && (
                    <span className="profile-card__badge">
                        {t('specialistProfile:card.verified')}
                    </span>
                )}

                <h2 className="profile-card__name" id="profile-card-name">
                    {specialist?.full_name}
                </h2>

                <p className="profile-card__role">{t('specialistProfile:card.role')}</p>
            </div>

            <ul className="profile-card__stats">
                <InfoTile
                    className="profile-card__info-tile"
                    icon={<LearnIcon />}
                    label={t('specialistProfile:card.stats.experience')}
                    value={`${t('specialistProfile:card.stats.experienceValue', { count: specialist?.experience_years })}`}
                />
                <InfoTile
                    className="profile-card__info-tile"
                    icon={<MoneyIcon />}
                    label={t('specialistProfile:card.stats.price')}
                    value={`${specialist?.price_per_hour} ₴`}
                />
                <InfoTile
                    className="profile-card__info-tile profile-card__info-tile--hide"
                    icon={<ClockCardIcon />}
                    label={t('specialistProfile:card.stats.sessionDuration')}
                    value={`${t('specialistProfile:card.stats.sessionDurationValue', { count: specialist?.session_minutes })}`}
                />
            </ul>

            <div className="profile-card__approach">
                <p className="profile-card__approach-label">
                    {t('specialistProfile:card.approach')}
                </p>
                <p className="profile-card__approach-value">{specialist?.methods.join(', ')}</p>
            </div>

            <div className="profile-card__actions">{actions}</div>
        </section>
    )
}
