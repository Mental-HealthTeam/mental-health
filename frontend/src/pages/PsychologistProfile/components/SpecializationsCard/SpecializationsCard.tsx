import classNames from 'classnames'
import { BalanceIcon } from '../../../../components/UI/Icons/WhyChoosePlatform'
import { SectionLabel } from '../../../../components/UI/SectionLabel'
import './SpecializationsCard.scss'
import { Tag } from '../../../../components/UI/Tag'
import { useAppSelector } from '../../../../app/hooks'
import { useTranslation } from 'react-i18next'

type Props = {
    className?: string
}

export const SpecializationsCard = ({ className }: Props) => {
    const { t } = useTranslation(['symptoms', 'specialistProfile'])
    const { profile } = useAppSelector((state) => state.specialistProfile)

    if (!profile) {
        return null
    }

    const symptoms = [...new Set(profile.tags_symptoms)]

    return (
        <section className={classNames('specializations-card', className)}>
            <SectionLabel
                className="specializations-card__section-label"
                startIcon={<BalanceIcon />}
            >
                {t('specialistProfile:specializations.title')}
            </SectionLabel>

            <div className="specializations-card__tags">
                {symptoms.map((code, i) => {
                    return (
                        <Tag className="specializations-card__tag" key={`${code}-${i}`}>
                            {t(`symptoms:${code}.title`)}
                        </Tag>
                    )
                })}
            </div>

            <hr className="specializations-card__divider" />

            <ul className="specializations-card__list">
                {symptoms.map((code, i) => (
                    <li className="specializations-card__item" key={`${code}-${i}`}>
                        {t(`symptoms:${code}.description`)}
                    </li>
                ))}
            </ul>
        </section>
    )
}
