import classNames from 'classnames'
import { Avatar } from '../UI/Avatar'
import { ReviewIcon, StarIcon } from '../UI/Icons'

import './ReviewCard.scss'
import { useTranslation } from 'react-i18next'

import avatarDefault from '../../assets/avatars/avatar-2.png'
import type { Rating } from '../../types/specialist'

type Props = {
    name: string
    age: number | null
    date: string
    rating: Rating
    text: string
    avatar: string | null
    className?: string
}

const MAX_RATING = 5

export const ReviewCard = ({ age = 20, avatar, date, name, rating, text, className }: Props) => {
    const { t, i18n } = useTranslation('reviews')

    const dateValue = new Date(date.length === 10 ? `${date}T00:00:00` : date)

    const formattedDate = new Intl.DateTimeFormat(i18n.language, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(dateValue)

    return (
        <article className={classNames('review-card', className)}>
            <ReviewIcon className="review-card__icon" />

            <div className="review-card__header">
                <Avatar className="review-card__avatar" src={avatar || avatarDefault} alt="" />
                <div className="review-card__author">
                    <h3 className="review-card__name">{`${name}, ${age} ${t('ageSuffix')}`}</h3>
                    <time className="review-card__date" dateTime={date}>
                        {formattedDate}
                    </time>
                </div>
            </div>

            <div
                className="review-card__rating"
                role="img"
                aria-label={t('ratingLabel', { rating })}
            >
                {Array.from({ length: MAX_RATING }, (_, i) => (
                    <span
                        className={classNames('review-card__star', {
                            'review-card__star--empty': i >= rating,
                        })}
                        aria-hidden="true"
                        key={i}
                    >
                        <StarIcon />
                    </span>
                ))}
            </div>

            <p className="review-card__text">{text}</p>
        </article>
    )
}
