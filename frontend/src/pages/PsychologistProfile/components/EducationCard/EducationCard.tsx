import './EducationCard.scss'

export const EducationCard = () => {
    return (
        <section className="education-card" aria-labelledby="education-title">
            <h2
                className="education-card__title section-label section-label--light"
                id="education-title"
            >
                <svg
                    className="section-label__icon"
                    aria-hidden="true"
                    width="16"
                    height="16"
                ></svg>
                Освіта
            </h2>
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
