import classNames from 'classnames'
import { LearnIcon } from '../../../../components/UI/Icons/WhyChoosePlatform'
import { SectionLabel } from '../../../../components/UI/SectionLabel'
import './EducationCard.scss'
import { useTranslation } from 'react-i18next'

type Props = {
    className?: string
    certificates?: { title: string }[]
}

export const EducationCard = ({ className, certificates }: Props) => {
    const { t } = useTranslation('specialistProfile')

    return (
        <section
            className={classNames('education-card', className)}
            aria-labelledby="education-title"
        >
            <SectionLabel className="education-card__section-label" startIcon={<LearnIcon />}>
                {t('education.title')}
            </SectionLabel>
            {certificates && (
                <ul className="education-card__list">
                    {certificates.map((item) => (
                        <li className="education-card__item" key={item.title}>
                            {item.title}
                        </li>
                    ))}
                </ul>
            )}

            {!certificates && (
                <p className="education-card__text-no-education">{t('education.empty')}</p>
            )}
        </section>
    )
}
