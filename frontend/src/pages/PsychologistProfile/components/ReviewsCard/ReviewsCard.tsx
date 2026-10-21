import classNames from 'classnames'
import './ReviewsCard.scss'
import { useState } from 'react'

type Props = {
    className?: string
}

type Category = 'anxiety' | 'stress' | 'relationships' | 'depression' | 'self-esteem'

type FILTER = {
    id: number
    category: Category
    label: string
}

const FILTERS: FILTER[] = [
    { id: 1, category: 'anxiety', label: 'Тривожність' },
    { id: 2, category: 'stress', label: 'Стрес' },
    { id: 3, category: 'relationships', label: 'Стосунки' },
    { id: 4, category: 'depression', label: 'Депресія' },
    { id: 5, category: 'self-esteem', label: 'Самооцінка' },
]

export const ReviewsCard = ({ className }: Props) => {
    const [category, setCategory] = useState<Category>('anxiety')

    return (
        <section className={classNames('reviews-card-card', className)}>
            <div className="reviews-card__tabs" role="tablist" aria-label="Категорії відгуків">
                {FILTERS.map((tab) => (
                    <button
                        className={classNames('reviews-card__tab', {
                            'reviews-card__tab--is-active': category === tab.category,
                        })}
                        onClick={() => setCategory(tab.category)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="reviews-card__panel" role="tabpanel">
                <article className="review-card">
                    <header className="review-card__header">
                        <img
                            className="review-card__avatar"
                            src="./img/reviewer.jpg"
                            alt="Олена Колченовська"
                            width="40"
                            height="40"
                        />
                        <div className="review-card__author">
                            <h3 className="review-card__name">Олена Колченовська</h3>
                            <div
                                className="review-card__rating"
                                role="img"
                                aria-label="Оцінка 5 з 5"
                            >
                                <span className="review-card__star">★</span>
                                <span className="review-card__star">★</span>
                                <span className="review-card__star">★</span>
                                <span className="review-card__star">★</span>
                                <span className="review-card__star">★</span>
                            </div>
                        </div>
                    </header>

                    <p className="review-card__text">
                        Проходила важкий період після розлучення. Дуже бережний підхід фахівця зумів
                        повернути мені відчуття ґрунту під ногами.
                    </p>

                    <time className="review-card__date" dateTime="2026-09-27">
                        27.09.2026
                    </time>
                </article>

                <div className="reviews-card__controls">
                    <button
                        className="reviews-card__arrow"
                        type="button"
                        aria-label="Попередній відгук"
                    >
                        ←
                    </button>
                    <button
                        className="reviews-card__arrow"
                        type="button"
                        aria-label="Наступний відгук"
                    >
                        →
                    </button>
                </div>
            </div>
        </section>
    )
}
