import classNames from 'classnames'
import './ReviewsCard.scss'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowButton } from '../../../../components/UI/ArrowButton'
import { SpecialistReviewCard } from '../SpecialistReviewCard'
import { useAppSelector } from '../../../../app/hooks'
import type { SymptomCode } from '../../../../types/psychologist'
import { useTranslation } from 'react-i18next'

type Props = {
    className?: string
}

export const ReviewsCard = ({ className }: Props) => {
    const { profile } = useAppSelector((state) => state.specialistProfile)

    const [category, setCategory] = useState<SymptomCode | undefined>(profile?.reviews[0].topic_id)
    const [index, setIndex] = useState(0)

    const trackRef = useRef<HTMLDivElement>(null)

    const { t } = useTranslation(['symptoms', 'specialistProfile'])

    const scrollToIndex = (i: number) => {
        const element = trackRef.current

        if (!element) return

        const slide = element.children[i] as HTMLElement | undefined

        if (!slide) return

        const left =
            slide.getBoundingClientRect().left -
            element.getBoundingClientRect().left +
            element.scrollLeft

        element.scrollTo({
            left,
            behavior: 'smooth',
        })
    }

    const handleScroll = () => {
        const element = trackRef.current

        if (!element) return

        setIndex(Math.round(element.scrollLeft / element.clientWidth))
    }

    const reviewCategories = useMemo(() => {
        return [...new Set((profile?.reviews ?? []).map(({ topic_id }) => topic_id))]
    }, [profile?.reviews])

    const filteredReviews = useMemo(() => {
        return profile?.reviews.filter((review) => review.topic_id === category)
    }, [category, profile?.reviews])

    useEffect(() => {
        trackRef.current?.scrollTo({ left: 0 })
    }, [category])

    if (!profile) {
        return (
            <div className="reviews-card">
                <p className="reviews-card__text-no-reviews">
                    {t('specialistProfile:reviews.empty')}
                </p>
            </div>
        )
    }

    return (
        <section className={classNames('reviews-card', className)}>
            {filteredReviews && (
                <div
                    className="reviews-card__tabs"
                    role="tablist"
                    aria-label={t('specialistProfile:reviews.categoriesAriaLabel')}
                >
                    {reviewCategories.map((symptom) => (
                        <button
                            className={classNames('reviews-card__tab', {
                                'reviews-card__tab--is-active': category === symptom,
                            })}
                            onClick={() => setCategory(symptom)}
                            key={symptom}
                        >
                            {t(`symptoms:${symptom}.title`)}
                        </button>
                    ))}
                </div>
            )}

            {filteredReviews && (
                <div className="reviews-card__panel" role="tabpanel">
                    <div className="reviews-card__slider-wrapper">
                        <div
                            className="reviews-card__slider"
                            ref={trackRef}
                            onScroll={handleScroll}
                        >
                            {filteredReviews.map((review) => (
                                <div className="reviews-card__slide" key={review.id} role="group">
                                    <SpecialistReviewCard
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

                    <div className="reviews-card__controls">
                        <ArrowButton
                            direction="left"
                            ariaLabel={t('specialistProfile:reviews.previousAriaLabel')}
                            disabled={index === 0}
                            onClick={() => scrollToIndex(index - 1)}
                        />

                        <ArrowButton
                            direction="right"
                            ariaLabel={t('specialistProfile:reviews.nextAriaLabel')}
                            disabled={index === filteredReviews.length - 1}
                            onClick={() => scrollToIndex(index + 1)}
                        />
                    </div>
                </div>
            )}
        </section>
    )
}
