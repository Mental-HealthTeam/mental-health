import classNames from 'classnames'
import { LearnIcon } from '../../../../components/UI/Icons/WhyChoosePlatform'
import { SectionLabel } from '../../../../components/UI/SectionLabel'
import './EducationCard.scss'
import { useAppSelector } from '../../../../app/hooks'

type Props = {
    className?: string
}

export const EducationCard = ({ className }: Props) => {
    const { profile } = useAppSelector((state) => state.specialistProfile)

    return (
        <section
            className={classNames('education-card', className)}
            aria-labelledby="education-title"
        >
            <SectionLabel className="education-card__section-label" startIcon={<LearnIcon />}>
                Освіта
            </SectionLabel>
            {profile && (
                <ul className="education-card__list">
                    {profile.certificates.map((item) => (
                        <li className="education-card__item" key={item}>
                            {item}
                        </li>
                    ))}
                </ul>
            )}

            {!profile && (
                <p className="education-card__text-no-education">Фахівець ще не надав інформції</p>
            )}
        </section>
    )
}
