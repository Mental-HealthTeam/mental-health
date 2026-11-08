import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
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
    const [isAtStart, setIsAtStart] = useState(true)
    const [isAtEnd, setIsAtEnd] = useState(false)

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

    const updateSliderButtons = useCallback(() => {
        const slider = sliderRef.current

        if (!slider) {
            return
        }

        const maxScrollLeft = slider.scrollWidth - slider.clientWidth

        setIsAtStart(slider.scrollLeft <= 1)
        setIsAtEnd(slider.scrollLeft >= maxScrollLeft - 1)
    }, [])

    useEffect(() => {
        updateSliderButtons()

        window.addEventListener('resize', updateSliderButtons)

        return () => {
            window.removeEventListener('resize', updateSliderButtons)
        }
    }, [updateSliderButtons])

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
                            <div
                                className="reviews-section__slider"
                                ref={sliderRef}
                                onScroll={updateSliderButtons}
                            >
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
                                disabled={isAtStart}
                            />

                            <ArrowButton
                                direction="right"
                                ariaLabel={t('nextReview')}
                                onClick={handleNext}
                                disabled={isAtEnd}
                            />
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    )
}
