import { LearnIcon } from '../../../../components/UI/Icons/WhyChoosePlatform'
import { SectionLabel } from '../../../../components/UI/SectionLabel'
import './EducationCard.scss'

export const EducationCard = () => {
    return (
        <section className="education-card" aria-labelledby="education-title">
            <SectionLabel className="education-card__section-label" startIcon={<LearnIcon />}>
                Освіта
            </SectionLabel>
            <ul className="education-card__list">
                <li className="education-card__item">
                    Диплом магістра психології (КНУ ім. Т. Шевченка, 2018)
                </li>
                <li className="education-card__item">
                    Сертифікована програма: «Когнітивно-поведінкова терапія депресивних та тривожних
                    розладів» (Український інститут КБТ)
                </li>
                <li className="education-card__item">
                    Сертифікована програма: «Гештальт-підхід у консультуванні»
                </li>
            </ul>
        </section>
    )
}
