import { HelpIcon } from '../../../../components/UI/Icons/WhyChoosePlatform'
import { SectionLabel } from '../../../../components/UI/SectionLabel'
import './AboutCard.scss'

export const AboutCard = () => {
    return (
        <section className="about-card" aria-labelledby="about-title">
            <SectionLabel className="about-card__section-label" startIcon={<HelpIcon />}>
                Про спеціаліста
            </SectionLabel>
            <p className="about-card__text">
                Вітаю! Я практикуючий психолог. Допомагаю відновити внутрішню опору, подолати
                тривожність та навчитися краще розуміти свої емоції в безпечному та бережному
                просторі.
            </p>
        </section>
    )
}
