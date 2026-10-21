import classNames from 'classnames'
import { LearnIcon } from '../../../../components/UI/Icons/WhyChoosePlatform'
import { SectionLabel } from '../../../../components/UI/SectionLabel'
import './EducationCard.scss'

type Props = {
    className?: string
}

export const EducationCard = ({ className }: Props) => {
    return (
        <section
            className={classNames('education-card', className)}
            aria-labelledby="education-title"
        >
            <SectionLabel className="education-card__section-label" startIcon={<LearnIcon />}>
                Освіта
            </SectionLabel>
            <ul className="education-card__list">
                <li className="education-card__item">
                    Диплом магістра психології (КНУ ім. Т. Шевченка, 2018)
                </li>
                <li className="education-card__item">
                    Сертифікована програма: «Когнітивно-поведінкова терапія дипресивних та тривожних
                    розладів» (Український Інститут КБТ)
                </li>
                <li className="education-card__item">
                    Сертифікована програма: «Гештальт у консультуванні»{' '}
                </li>
                <li className="education-card__item">
                    Сертифікована програма: «Cиндром дефіциту уваги»{' '}
                </li>
            </ul>
        </section>
    )
}
