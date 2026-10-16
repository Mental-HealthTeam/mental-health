import { useRef, type CSSProperties } from 'react'
import { ReviewCard } from '../ReviewCard'
import { ArrowButton } from '../UI/ArrowButton'
import { SectionIndex } from '../UI/SectionIndex'
import { useScreenLayout } from '../../hooks'
import reviewsImage from '../../assets/images/reviews-image.png'
import { Container } from '../Container'
import avatar1 from '../../assets/avatars/avatar-1.png'

import './ReviewsSection.scss'
import { useTranslation } from 'react-i18next'

export type Review = {
    id: string
    name: string
    age: number
    date: string
    rating: 1 | 2 | 3 | 4 | 5
    text: string
    avatar: string
}

const REVIEW_MOCK: Review = {
    id: 'review-1',
    name: 'Олена',
    age: 29,
    date: '2026-09-27',
    rating: 4,
    text: 'Вже після 2-х сесій відчула значне полегшення. Психолог допомогла розібратися з причинами втоми та навчила простим технікам самодопомоги.',
    avatar: avatar1,
}

const REVIEWS_MOCK: Review[] = Array.from({ length: 5 }, (_, i) => ({
    ...REVIEW_MOCK,
    id: `review-${i + 1}`,
}))

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
                                            avatar={review.avatar}
                                            date={review.date}
                                            name={review.name}
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
