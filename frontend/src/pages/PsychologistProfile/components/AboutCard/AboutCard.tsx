import classNames from 'classnames'
import { HelpIcon } from '../../../../components/UI/Icons/WhyChoosePlatform'
import { SectionLabel } from '../../../../components/UI/SectionLabel'
import './AboutCard.scss'
import { useTranslation } from 'react-i18next'

type Props = {
    className?: string
    about?: string
}

export const AboutCard = ({ className, about }: Props) => {
    const { t } = useTranslation('specialistProfile')

    return (
        <section className={classNames('about-card', className)} aria-labelledby="about-title">
            <SectionLabel className="about-card__section-label" startIcon={<HelpIcon />}>
                {t('about.title')}
            </SectionLabel>
            <p className="about-card__text">{about || t('about.empty')}</p>
        </section>
    )
}
