import classNames from 'classnames'
import { BalanceIcon } from '../../../../components/UI/Icons/WhyChoosePlatform'
import { SectionLabel } from '../../../../components/UI/SectionLabel'
import './SpecializationsCard.scss'
import { Tag } from '../../../../components/UI/Tag'
import { useTranslation } from 'react-i18next'
import type { SymptomCode } from '../../../../types/psychologist'

type Props = {
    className?: string
    tags_symptoms?: SymptomCode[]
}

export const SpecializationsCard = ({ className, tags_symptoms }: Props) => {
    const { t } = useTranslation(['symptoms', 'specialistProfile', 'specialistProfile'])

    const symptoms = [...new Set(tags_symptoms)]

    return (
        <section className={classNames('specializations-card', className)}>
            <SectionLabel
                className="specializations-card__section-label"
                startIcon={<BalanceIcon />}
            >
                {t('specialistProfile:specializations.title')}
            </SectionLabel>

            {symptoms.length !== 0 && (
                <>
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
                </>
            )}
            {symptoms.length === 0 && (
                <p className="specializations-card__text-no-specializations">
                    {t('specialistProfile:education.empty')}
                </p>
            )}
        </section>
    )
}
