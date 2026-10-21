import classNames from 'classnames'
import type { SpecialistProfile } from '../../../../types/specialist'
import { Button } from '../../../../components/UI/Button'

import './SpecialistProfileCard.scss'
import { InfoTile } from '../../../../components/InfoTile'
import { LearnIcon } from '../../../../components/UI/Icons/WhyChoosePlatform'
import { ClockCardIcon, MoneyIcon } from '../../../../components/UI/Icons'

type Props = {
    className?: string
    specialist: SpecialistProfile
    onBook: () => void
}

export const SpecialistProfileCard = ({ className, specialist, onBook }: Props) => {
    return (
        <section className={classNames('profile-card', className)}>
            <img className="profile-card__photo" src={specialist.photo} alt={specialist.name} />

            <div className="profile-card__heading">
                {specialist.isVerified && <span className="profile-card__badge">Перевірено</span>}

                <h2 className="profile-card__name" id="profile-card-name">
                    {specialist.name}
                </h2>

                <p className="profile-card__role">Практикуючий психолог</p>
            </div>

            <ul className="profile-card__stats">
                <InfoTile
                    className="profile-card__info-tile"
                    icon={<LearnIcon />}
                    label="Досвід"
                    value={`${specialist.experienceYears} років`}
                />
                <InfoTile
                    className="profile-card__info-tile"
                    icon={<MoneyIcon />}
                    label="Вартість"
                    value={`${specialist.price} ₴`}
                />
                <InfoTile
                    className="profile-card__info-tile profile-card__info-tile--hide"
                    icon={<ClockCardIcon />}
                    label="Тривалість сесії"
                    value={`${specialist.sessionMinutes} хвилин`}
                />
            </ul>

            <div className="profile-card__approach">
                <p className="profile-card__approach-label">Терапевтичний підхід:</p>
                <p className="profile-card__approach-value">{specialist.approaches.join(', ')}</p>
            </div>

            <div className="profile-card__region-button">
                <Button
                    className="specialist-card__booking-button"
                    variant="primary"
                    size="medium"
                    fullWidth
                    onClick={() => onBook()}
                >
                    ЗАБРОНЮВАТИ СЕСІЮ
                </Button>
            </div>
        </section>
    )
}
