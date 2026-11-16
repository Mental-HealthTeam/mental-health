import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { skipToken } from '@reduxjs/toolkit/query'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import {
    clearBookingDraft,
    consumeBookingResume,
    restoreBooking,
} from '../../app/store/slices/bookingSlice'
import { useMeQuery } from '../../services/authApi'
import { useGetBookingByIdQuery } from '../../services/psychologistsApi'
import type { Booking } from '../../types/booking'

import {
    canContinuePayment,
    readPendingBookingId,
    removePendingBookingId,
} from './bookingResume.utils'

type ResumeOffer = {
    booking: Booking
    locationKey: string
}

type Props = {
    hasActiveModal: boolean
    onUserChange: () => void
}

export const usePendingBookingResume = ({ hasActiveModal, onUserChange }: Props) => {
    const location = useLocation()
    const dispatch = useAppDispatch()
    const { i18n } = useTranslation()

    const previousUserId = useRef<string | null | undefined>(undefined)
    const processedBookings = useRef(new Set<string>())

    const [storedBookingId, setStoredBookingId] = useState(readPendingBookingId)
    const [offer, setOffer] = useState<ResumeOffer | null>(null)

    const { bookingId, resumeAfterLogin, returnPath } = useAppSelector((state) => state.booking)

    const {
        currentData: user,
        isFetching: isCheckingUser,
        isSuccess: isUserLoaded,
        error: userError,
    } = useMeQuery()

    const currentPath = location.pathname + location.search + location.hash

    const isReturnPage =
        resumeAfterLogin && returnPath === currentPath && location.pathname !== '/sign-in'

    const isPaymentPage = location.pathname.startsWith('/payment/')

    const pendingBookingId = isReturnPage && bookingId ? bookingId : storedBookingId

    const language: 'uk' | 'en' = (i18n.resolvedLanguage ?? i18n.language).startsWith('en')
        ? 'en'
        : 'uk'

    const shouldCheckBooking =
        Boolean(user) &&
        !isCheckingUser &&
        Boolean(pendingBookingId) &&
        !hasActiveModal &&
        !isPaymentPage &&
        location.pathname !== '/sign-in' &&
        location.pathname !== '/sign-up'

    const {
        currentData: booking,
        isFetching: isCheckingBooking,
        error: bookingError,
    } = useGetBookingByIdQuery(
        shouldCheckBooking && pendingBookingId
            ? { id: pendingBookingId, lang: language }
            : skipToken,
        { refetchOnMountOrArgChange: true },
    )

    const closeResumeModal = useCallback(() => {
        setOffer(null)
    }, [])

    const discardBooking = useCallback(
        (id: string) => {
            removePendingBookingId(id)

            setStoredBookingId((current) => (current === id ? null : current))

            setOffer((current) => (current?.booking.booking_id === id ? null : current))

            if (bookingId === id) {
                dispatch(clearBookingDraft())
            }
        },
        [bookingId, dispatch],
    )

    const expireBooking = useCallback(() => {
        if (offer) {
            discardBooking(offer.booking.booking_id)
        }
    }, [offer, discardBooking])

    useEffect(() => {
        if (isCheckingUser) {
            return
        }

        const isUnauthorized = userError && 'status' in userError && userError.status === 401

        if (!isUserLoaded && !isUnauthorized) {
            return
        }

        const currentUserId = user?.id ?? null

        if (
            previousUserId.current !== undefined &&
            previousUserId.current !== null &&
            previousUserId.current !== currentUserId
        ) {
            const id = readPendingBookingId()

            if (id) {
                removePendingBookingId(id)
            }

            setStoredBookingId(null)
            setOffer(null)
            processedBookings.current.clear()

            dispatch(clearBookingDraft())
            onUserChange()
        }

        previousUserId.current = currentUserId
    }, [user, userError, isUserLoaded, isCheckingUser, dispatch, onUserChange])

    useEffect(() => {
        if (
            !shouldCheckBooking ||
            isCheckingBooking ||
            bookingError ||
            !booking ||
            booking.booking_id !== pendingBookingId ||
            !user
        ) {
            return
        }

        const processedKey = `${user.id}:${booking.booking_id}`

        if (processedBookings.current.has(processedKey)) {
            return
        }

        processedBookings.current.add(processedKey)

        if (!canContinuePayment(booking)) {
            discardBooking(booking.booking_id)

            if (resumeAfterLogin) {
                dispatch(consumeBookingResume())
            }

            return
        }

        dispatch(restoreBooking(booking))

        setOffer({
            booking,
            locationKey: location.key,
        })
    }, [
        shouldCheckBooking,
        isCheckingBooking,
        bookingError,
        booking,
        pendingBookingId,
        user,
        resumeAfterLogin,
        location.key,
        discardBooking,
        dispatch,
    ])

    useEffect(() => {
        if (
            !shouldCheckBooking ||
            isCheckingBooking ||
            !pendingBookingId ||
            !bookingError ||
            !('status' in bookingError)
        ) {
            return
        }

        if (bookingError.status === 404 || bookingError.status === 422) {
            discardBooking(pendingBookingId)

            if (resumeAfterLogin) {
                dispatch(consumeBookingResume())
            }
        }
    }, [
        shouldCheckBooking,
        isCheckingBooking,
        pendingBookingId,
        bookingError,
        resumeAfterLogin,
        discardBooking,
        dispatch,
    ])

    const activeOffer =
        offer?.locationKey === location.key && user && !isCheckingUser && !isPaymentPage
            ? offer
            : null

    return {
        user,
        isCheckingUser,
        isReturnPage,
        language,
        activeOffer,
        closeResumeModal,
        expireBooking,
    }
}
