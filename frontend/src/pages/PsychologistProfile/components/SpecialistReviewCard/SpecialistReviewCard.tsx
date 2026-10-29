import classNames from 'classnames'
import './SpecialistReviewCard.scss'
import { Avatar } from '../../../../components/UI/Avatar'
import { StarIcon } from '../../../../components/UI/Icons'
import avatarDefault from '../../../../assets/avatars/avatar-1.png'
import { useTranslation } from 'react-i18next'

type Props = {
    name: string
    age?: number | null
    avatar: string | null
    date: string
    rating: number
    text: string
    className?: string
}

const MAX_RATING = 5

export const SpecialistReviewCard = ({
    name,
    age,
    avatar,
    date,
    rating,
    text,
    className,
}: Props) => {
    const { t } = useTranslation('specialistProfile')

    return (
        <article className={classNames('specialist-review-card', className)}>
            <div className="specialist-review-card__header">
                <Avatar
                    className="review-card__avatar"
                    src={avatar ? avatar : avatarDefault}
                    alt=""
                />

                <div className="specialist-review-card__author">
                    <h3 className="specialist-review-card__name">
                        {name}
                        {age ? `, ${age}` : null}
                    </h3>

                    <div
                        className="specialist-review-card__rating"
                        role="img"
                        aria-label={t('reviews.ratingAriaLabel', { rating, max: MAX_RATING })}
                    >
                        {Array.from({ length: MAX_RATING }, (_, i) => (
                            <span
                                key={i}
                                className={classNames('specialist-review-card__star', {
                                    'specialist-review-card__star--empty': i >= rating,
                                })}
                                aria-hidden="true"
                            >
                                <StarIcon />
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <p className="specialist-review-card__text">{text}</p>

            <time className="specialist-review-card__date">{date}</time>
        </article>
    )
}
