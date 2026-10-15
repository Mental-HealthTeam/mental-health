import classNames from 'classnames'
import { CreateIcon } from '../../../../components/UI/Icons/WhyChoosePlatform'
import { SectionLabel } from '../../../../components/UI/SectionLabel'
import './Reviews.scss'

type Props = {
    className?: string
}

export const Reviews = ({ className }: Props) => {
    return (
        <section className={classNames('reviews', className)}>
            <SectionLabel className="reviews__section-label" startIcon={<CreateIcon />}>
                Відгуки
            </SectionLabel>

            <div className="reviews__tabs" role="tablist" aria-label="Категорії відгуків">
                <button className="tab tab--active" role="tab" aria-selected="true" type="button">
                    Стрес та депресія
                </button>
                <button className="tab" role="tab" aria-selected="false" type="button">
                    Самооцінка
                </button>
                <button className="tab" role="tab" aria-selected="false" type="button">
                    Стосунки
                </button>
                <button className="tab" role="tab" aria-selected="false" type="button">
                    Тривожність
                </button>
                <button className="tab" role="tab" aria-selected="false" type="button">
                    Вигорання та втома
                </button>
            </div>

            <div className="reviews__panel" role="tabpanel">
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

                <div className="reviews__controls">
                    <button className="reviews__arrow" type="button" aria-label="Попередній відгук">
                        ←
                    </button>
                    <button className="reviews__arrow" type="button" aria-label="Наступний відгук">
                        →
                    </button>
                </div>
            </div>
        </section>
    )
}
