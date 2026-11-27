from uuid import UUID

from fastapi import status
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.models.models import User, Booking, Review, Language, Psychologist, PsychologistStatus, BookingStatus
from exceptions.base import AppError
from schemas.reviews import ReviewCreate, ReviewResponse, UserReview, ReviewViewResponse, ReviewListResponse
from services.localization import pick


async def create_comment_service(
    db: AsyncSession,
    current_user: User,
    data: ReviewCreate
):
    if current_user.id != data.client_id:
        raise AppError(
            status.HTTP_403_FORBIDDEN,
            "REVIEW_CLIENT_MISMATCH",
            "You can only leave a review on your own behalf.",
        )
    booking = await db.get(Booking, data.booking_id)
    if not booking:
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "BOOKING_NOT_FOUND",
            "Booking not found.",
        )
    if (
        booking.psychologist_id != data.psychologist_id
        or booking.client_id != data.client_id
    ):
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "BOOKING_NOT_FOUND",
            "Booking not found.",
        )
    if booking.status != BookingStatus.COMPLETED:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "REVIEW_SESSION_NOT_COMPLETED",
            "You can only review a completed session.",
        )
    review = Review(
        booking_id=data.booking_id,
        client_id=data.client_id,
        psychologist_id=data.psychologist_id,
        rating=data.rating,
        review_text=data.review_text,
        review_text_eng=data.review_text_eng,
    )
    try:
        db.add(review)
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        raise AppError(
            status.HTTP_409_CONFLICT,
            "REVIEW_ALREADY_EXISTS",
            "A review for this booking already exists.",
        ) from e
    except SQLAlchemyError as e:
        await db.rollback()
        raise AppError(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "REVIEW_CREATE_FAILED",
            "Could not save your review. Please try again later.",
        ) from e
    user = UserReview(
        name=current_user.name,
        avatar_url=current_user.avatar_url
    )
    return ReviewResponse(
        client=user,
        booking_id=review.booking_id,
        psychologist_id=review.psychologist_id,
        review_text=review.review_text,
        review_text_eng=review.review_text_eng,
        rating=review.rating,
        created_at=review.created_at
    )


async def get_psychologist_comments_service(
    psychologist_id: UUID,
    db: AsyncSession,
    lang: Language,
    limit: int,
    offset: int
):
    psychologist = await db.get(Psychologist, psychologist_id)

    if (
            not psychologist
            or psychologist.profile_status != PsychologistStatus.ACTIVE
    ):
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "PSYCHOLOGIST_NOT_FOUND",
            "Psychologist not found",
        )
    filters = [
        Review.psychologist_id == psychologist_id,
    ]

    stmt = select(Review).where(
        *filters
    ).options(
        selectinload(Review.client),
    ).order_by(
        Review.created_at.desc()
    ).offset(offset).limit(limit)
    result = await db.execute(stmt)
    reviews = result.scalars().all()

    stmt = select(func.count()).where(
        *filters
    )
    total = (await db.execute(stmt)).scalar()
    items = [
        ReviewViewResponse(
            client=UserReview(
                name=review.client.name,
                avatar_url=review.client.avatar_url
            ),
            psychologist_id=review.psychologist_id,
            review_text=pick(
                review.review_text,
                review.review_text_eng,
                lang
            ),
            rating=review.rating,
            created_at=review.created_at
        )
        for review in reviews
    ]

    return ReviewListResponse(
        items=items,
        total=total
    )
