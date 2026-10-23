import { useRef, type CSSProperties } from 'react'
import { ReviewCard } from '../ReviewCard'
import { ArrowButton } from '../UI/ArrowButton'
import { SectionIndex } from '../UI/SectionIndex'
import { useScreenLayout } from '../../hooks'
import reviewsImage from '../../assets/images/reviews-image.png'
import { Container } from '../Container'

import './ReviewsSection.scss'
import { useTranslation } from 'react-i18next'
import { REVIEWS_MOCK } from '../../mocks/reviewsMock'

const SLIDER_GAP = 16

export const ReviewsSection = () => {
    const sliderRef = useRef<HTMLDivElement>(null)
    const { t } = useTranslation('reviews')

    const { visibleCards } = useScreenLayout()

    const sliderStyle = {
        '--visible-cards': visibleCards,
    } as CSSProperties

    const handlePrevious = () => {
        const slider = sliderRef.current

        if (!slider) {
            return
        }

        slider.scrollBy({
            left: -(slider.clientWidth + SLIDER_GAP),
            behavior: 'smooth',
        })
    }

    const handleNext = () => {
        const slider = sliderRef.current

        if (!slider) {
            return
        }

        slider.scrollBy({
            left: slider.clientWidth + SLIDER_GAP,
            behavior: 'smooth',
        })
    }

    return (
        <section className="reviews-section" aria-labelledby="reviews-section-title">
            <Container className="reviews-section__container">
                <div className="reviews-section__header">
                    <SectionIndex index={5} className="reviews-section__section-index" />

                    <h2 className="reviews-section__title" id="reviews-section-title">
                        {t('title')}
                    </h2>
                    <p className="reviews-section__subtitle">{t('subtitle')}</p>
                </div>

                <div
                    className="reviews-section__content"
                    role="region"
                    aria-roledescription="carousel"
                    aria-label={t('contentLabel')}
                >
                    <div className="reviews-section__media">
                        <img
                            className="reviews-section__image"
                            src={reviewsImage}
                            alt=""
                            loading="lazy"
                        />
                    </div>

                    <div className="reviews-section__region-reviews">
                        <div className="reviews-section__slider-wrapper" style={sliderStyle}>
                            <div className="reviews-section__slider" ref={sliderRef}>
                                {REVIEWS_MOCK.map((review) => (
                                    <div
                                        className="reviews-section__slide"
                                        key={review.id}
                                        role="group"
                                    >
                                        <ReviewCard
                                            age={review.age}
                                            avatar={review.avatar_url}
                                            date={review.created_at}
                                            name={review.author}
                                            rating={review.rating}
                                            text={review.text}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="reviews-section__controls">
                            <ArrowButton
                                direction="left"
                                ariaLabel={t('previousReview')}
                                onClick={handlePrevious}
                            />

                            <ArrowButton
                                direction="right"
                                ariaLabel={t('nextReview')}
                                onClick={handleNext}
                            />
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    )
}
