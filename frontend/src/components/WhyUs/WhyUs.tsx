import { useTranslation } from 'react-i18next'

import specialistImage from '../../assets/images/photo-card.png'

import { whyUsCards } from '../../constants/whyUs'

import { Container } from '../Container'
import { PrimaryButton } from '../UI/Buttons'
import { ArrowIcon } from '../UI/Icons'
import { SectionIndex } from '../UI/SectionIndex'

import './WhyUs.scss'
import { useAppDispatch } from '../../app/hooks'
import { openAiChat } from '../../app/store/slices/aiChatSlice'

const FEATURED_SPECIALIST = {
    image: specialistImage,
    name: 'Олена',
    specialization: 'гештальт-терапевт',
}

export const WhyUs = () => {
    const dispatch = useAppDispatch()
    const { t } = useTranslation('whyUs')

    const handleOpenChat = () => {
        dispatch(openAiChat())
    }

    return (
        <section className="why-us" id="about">
            <Container className="why-us__container">
                <SectionIndex index={4} className="why-us__section-index" />

                <h2 className="why-us__title">
                    {t('title')} <span className="why-us__title-accent">{t('titleAccent')}</span>
                </h2>

                <div className="why-us__grid">
                    {whyUsCards.map((card) => {
                        const className = `why-us__card ${card.className}`

                        if (card.type === 'value') {
                            return (
                                <article className={className} key={card.id}>
                                    <strong className="why-us__value">{t(card.valueKey)}</strong>

                                    <p className="why-us__small-text">{t(card.textKey)}</p>
                                </article>
                            )
                        }

                        if (card.type === 'matching') {
                            return (
                                <article className={className} key={card.id}>
                                    <strong className="why-us__matching-value">
                                        {t(card.valueKey)}
                                    </strong>

                                    <p className="why-us__matching-text">{t(card.textKey)}</p>
                                </article>
                            )
                        }

                        return (
                            <article className={className} key={card.id}>
                                <span className="why-us__label">{t(card.labelKey)}</span>

                                <p className="why-us__caption">{t(card.captionKey)}</p>

                                <p className="why-us__text">{t(card.textKey)}</p>
                            </article>
                        )
                    })}

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

                <PrimaryButton
                    className="why-us__button"
                    endIcon={<ArrowIcon />}
                    aria-label={t('cta')}
                    onClick={handleOpenChat}
                >
                    {t('cta')}
                </PrimaryButton>
            </Container>
        </section>
    )
}
