import classNames from 'classnames'
import { HelpIcon } from '../../../../components/UI/Icons/WhyChoosePlatform'
import { SectionLabel } from '../../../../components/UI/SectionLabel'
import './AboutCard.scss'
import { useAppSelector } from '../../../../app/hooks'

type Props = {
    className?: string
}

export const AboutCard = ({ className }: Props) => {
    const { profile } = useAppSelector((state) => state.specialistProfile)

    return (
        <section className={classNames('about-card', className)} aria-labelledby="about-title">
            <SectionLabel className="about-card__section-label" startIcon={<HelpIcon />}>
                Про спеціаліста
            </SectionLabel>
            <p className="about-card__text">
                {profile ? profile.bio.about : 'Фахівець ще не надав інформції'}
            </p>
        </section>
    )
}
