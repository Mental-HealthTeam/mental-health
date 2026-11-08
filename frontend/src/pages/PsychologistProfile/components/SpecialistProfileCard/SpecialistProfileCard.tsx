import classNames from 'classnames'

import './SpecialistProfileCard.scss'
import { InfoTile } from '../../../../components/InfoTile'
import { AvatarFallbackIcon, AwardIcon, MoneyIcon } from '../../../../components/UI/Icons'
import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { SpecialistProfile } from '../../../../types/specialist'
import { ClockCardIcon } from '../../../../components/UI/Icons/ClockCardIcon'
import { SpecialistPhoto } from '../../../../components/UI/SpecialistPhoto'

type Props = {
    specialist: SpecialistProfile
    actions: ReactNode
    className?: string
}

export const SpecialistProfileCard = ({ className, specialist, actions }: Props) => {
    const { t, i18n } = useTranslation([
        'psychologists',
        'symptoms',
        'accessibility',
        'specialistProfile',
    ])

    const formattedPrice = new Intl.NumberFormat(i18n.language, {
        maximumFractionDigits: 0,
    }).format(Number(specialist.price_per_hour))

    return (
        <section
            className={classNames('profile-card', className)}
            aria-labelledby="profile-card-name"
        >
            <div className="profile-card__region-photo">
                <SpecialistPhoto
                    src={specialist.avatar_url}
                    className="profile-card__photo"
                    alt=""
                    fallback={<AvatarFallbackIcon className="profile-card__fallback-icon" />}
                />
            </div>

            <div className="profile-card__heading">
                {specialist.is_verified && (
                    <span className="profile-card__badge">
                        {t('specialistProfile:card.verified')}
                    </span>
                )}

                <h2 className="profile-card__name" id="profile-card-name">
                    {specialist.full_name}
                </h2>

                <p className="profile-card__role">{t('specialistProfile:card.role')}</p>
            </div>

            <ul className="profile-card__stats">
                <InfoTile
                    className="profile-card__info-tile"
                    icon={<AwardIcon />}
                    label={t('specialistProfile:card.stats.experience')}
                    value={`${t('specialistProfile:card.stats.experienceValue', { count: specialist.experience_years })}`}
                />
                <InfoTile
                    className="profile-card__info-tile profile-card__info-tile--desktop-only"
                    icon={<ClockCardIcon />}
                    label={t('specialistProfile:card.stats.sessionDuration')}
                    value={`${t('specialistProfile:card.stats.sessionDurationValue', { count: specialist.session_minutes })}`}
                />
                <InfoTile
                    className="profile-card__info-tile"
                    icon={<MoneyIcon />}
                    label={
                        <>
                            <span className="profile-card__label--desktop">
                                {t('specialistProfile:card.stats.price')}
                            </span>
                            <span className="profile-card__label--mobile">
                                {t('specialistProfile:card.stats.priceWithDuration', {
                                    count: specialist.session_minutes,
                                })}
                            </span>
                        </>
                    }
                    value={t('psychologists:card.price', {
                        price: formattedPrice,
                    })}
                />
            </ul>

            <div className="profile-card__approach">
                <p className="profile-card__approach-label">
                    {t('specialistProfile:card.approach')}
                </p>
                <p className="profile-card__approach-value">{specialist.methods?.join(', ')}</p>
            </div>

            <div className="profile-card__actions">{actions}</div>
        </section>
    )
}
