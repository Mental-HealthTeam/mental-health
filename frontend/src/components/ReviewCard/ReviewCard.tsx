import classNames from 'classnames'
import { Avatar } from '../UI/Avatar'
import { ReviewIcon, StarIcon } from '../UI/Icons'

import './ReviewCard.scss'

type Props = {
    name: string
    age: number
    date: string
    rating: 1 | 2 | 3 | 4 | 5
    text: string
    avatar: string
}

export const ReviewCard = ({ age, avatar, date, name, rating, text }: Props) => {
    return (
        <article className="review-card">
            <ReviewIcon className="review-card__icon" />

            <div className="review-card__header">
                <Avatar className="review-card__avatar" src={avatar} alt={avatar} />
                <div className="review-card__author">
                    <h3 className="review-card__name">{`${name}, ${age} років`}</h3>
                    <time className="review-card__date" dateTime={date}>
                        {date}
                    </time>
                </div>
            </div>

            <div className="review-card__rating" role="img" aria-label={`Оцінка ${rating} з 5`}>
                {[1, 2, 3, 4, 5].map((star) => {
                    return (
                        <span
                            className={classNames('review-card__star', {
                                'review-card__star--empty': star > rating,
                            })}
                            aria-hidden="true"
                            key={star}
                        >
                            <StarIcon />
                        </span>
                    )
                })}
            </div>

            <p className="review-card__text">{text}</p>
        </article>
    )
}
