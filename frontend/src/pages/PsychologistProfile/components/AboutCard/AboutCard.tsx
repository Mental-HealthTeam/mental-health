import './AboutCard.scss'

export const AboutCard = () => {
    return (
        <section className="about-card" aria-labelledby="about-title">
            <h2 className="about-card__title section-label" id="about-title">
                <svg
                    className="section-label__icon"
                    aria-hidden="true"
                    width="16"
                    height="16"
                ></svg>
                Про спеціаліста
            </h2>
            <p className="about-card__text">
                Вітаю! Я практикуючий психолог. Допомагаю відновити внутрішню опору, подолати
                тривожність та навчитися краще розуміти свої емоції в безпечному та бережному
                просторі.
            </p>
        </section>
    )
}
