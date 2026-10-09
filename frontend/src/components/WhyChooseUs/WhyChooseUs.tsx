import { useTranslation } from 'react-i18next'

import specialistImage from '../../assets/images/photo-card.png'

import { Container } from '../Container'
import { Button } from '../UI/Button'

import './WhyChooseUs.scss'

const FEATURED_SPECIALIST = {
    image: specialistImage,
    name: 'Олена',
    specialization: 'гештальт-терапевт',
}

export const WhyChooseUs = () => {
    const { t } = useTranslation('whyChooseUs')

    return (
        <section className="why-us" id="about">
            <Container className="why-us__container">
                <div className="why-us__number">
                    <span>04</span>
                    <span className="why-us__number-line" aria-hidden="true" />
                </div>

                <h2 className="why-us__title">
                    {t('title')} <span className="why-us__title-accent">{t('titleAccent')}</span>
                </h2>

                <div className="why-us__grid">
                    <article className="why-us__card why-us__card--ai">
                        <span className="why-us__label">{t('ai.label')}</span>

                        <p className="why-us__caption">{t('ai.caption')}</p>

                        <p className="why-us__text">{t('ai.text')}</p>
                    </article>

                    <article className="why-us__card why-us__card--specialists">
                        <strong className="why-us__value">{t('specialists.value')}</strong>

                        <p className="why-us__small-text">{t('specialists.text')}</p>
                    </article>

                    <article className="why-us__card why-us__card--availability">
                        <strong className="why-us__value">{t('availability.value')}</strong>

                        <p className="why-us__small-text">{t('availability.text')}</p>
                    </article>

                    <article className="why-us__card why-us__card--speed">
                        <span className="why-us__label">{t('speed.label')}</span>

                        <p className="why-us__caption">{t('speed.caption')}</p>

                        <p className="why-us__text">{t('speed.text')}</p>
                    </article>

                    <article className="why-us__card why-us__card--matching">
                        <strong className="why-us__matching-value">{t('matching.value')}</strong>

                        <p className="why-us__matching-text">{t('matching.text')}</p>
                    </article>

                    <article className="why-us__card why-us__card--flexibility">
                        <span className="why-us__label">{t('flexibility.label')}</span>

                        <p className="why-us__caption">{t('flexibility.caption')}</p>

                        <p className="why-us__text">{t('flexibility.text')}</p>
                    </article>

                    <article className="why-us__specialist">
                        <img
                            className="why-us__specialist-image"
                            src={FEATURED_SPECIALIST.image}
                            alt={t('specialist.imageAlt')}
                        />

                        <div className="why-us__specialist-info">
                            <span className="why-us__specialist-dot" aria-hidden="true" />

                            <span className="why-us__specialist-text">
                                {FEATURED_SPECIALIST.name}, {FEATURED_SPECIALIST.specialization}
                            </span>
                        </div>
                    </article>
                </div>

                <Button
                    className="why-us__button"
                    href="#ai-search"
                    variant="primary"
                    size="medium"
                    ariaLabel={t('cta')}
                >
                    {t('cta')}
                </Button>
            </Container>
        </section>
    )
}
