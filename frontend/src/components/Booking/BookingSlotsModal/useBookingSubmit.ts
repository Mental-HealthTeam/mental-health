import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import {
    requestBookingResume,
    restoreBooking,
    setBookingDraft,
} from '../../../app/store/slices/bookingSlice'
import { useCreateBookingMutation, useCreateCheckoutMutation } from '../../../services/bookingsApi'
import type { CreateBookingRequest } from '../../../types/booking'

const STORAGE_KEY = 'mental-health:pending-booking-id'

const savePendingBookingId = (bookingId: string) => {
    try {
        sessionStorage.setItem(STORAGE_KEY, bookingId)
    } catch {
        // Continue with Redux if storage is unavailable.
    }
}

const isSameTime = (first: string, second: string) => {
    const firstTime = Date.parse(first)
    const secondTime = Date.parse(second)

    return Number.isFinite(firstTime) && firstTime === secondTime
}

type Props = {
    psychologistId: string
    initialSelectedTime: string
    aiSessionId?: string
    onClose: () => void
}

export const useBookingSubmit = ({
    psychologistId,
    initialSelectedTime,
    aiSessionId,
    onClose,
}: Props) => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const location = useLocation()

    const { draft, bookingId: savedBookingId } = useAppSelector((state) => state.booking)

    const submittingRef = useRef(false)

    const [selectedSlot, setSelectedSlot] = useState(
        () =>
            initialSelectedTime ||
            (savedBookingId && draft?.psychologist_id === psychologistId
                ? draft.selected_time
                : ''),
    )

    const [
        createBooking,
        { isLoading: isCreatingBooking, error: bookingError, reset: resetBooking },
    ] = useCreateBookingMutation()

    const [
        createCheckout,
        { isLoading: isCreatingCheckout, error: checkoutError, reset: resetCheckout },
    ] = useCreateCheckoutMutation()

    const isSubmitting = isCreatingBooking || isCreatingCheckout

    const matchingBookingId =
        draft?.psychologist_id === psychologistId &&
        isSameTime(draft.selected_time, selectedSlot) &&
        draft.ai_session_id === aiSessionId
            ? savedBookingId
            : null

    const resetErrors = () => {
        resetBooking()
        resetCheckout()
    }

    const handleSelectSlot = (time: string) => {
        if (submittingRef.current) {
            return
        }

        setSelectedSlot(time)
        resetErrors()
    }

    const handleClose = () => {
        if (!submittingRef.current) {
            onClose()
        }
    }

    const redirectToLogin = () => {
        const returnPath = location.pathname + location.search + location.hash

        dispatch(requestBookingResume(returnPath))
        onClose()

        navigate('/sign-in', {
            state: { from: returnPath },
        })
    }

    const submit = async (availableTime?: string) => {
        if (submittingRef.current || (!availableTime && !matchingBookingId)) {
            return
        }

        submittingRef.current = true
        resetErrors()

        try {
            let bookingId = matchingBookingId

            if (!bookingId) {
                if (!availableTime) {
                    return
                }

                const nextDraft: CreateBookingRequest = {
                    psychologist_id: psychologistId,
                    selected_time: availableTime,
                    ...(aiSessionId ? { ai_session_id: aiSessionId } : {}),
                }

                dispatch(setBookingDraft(nextDraft))

                const result = await createBooking(nextDraft)

                if (result.error) {
                    if ('status' in result.error && result.error.status === 401) {
                        redirectToLogin()
                    }

                    return
                }

                if (!result.data) {
                    return
                }

                bookingId = result.data.booking_id

                savePendingBookingId(bookingId)
                dispatch(restoreBooking(result.data))
            } else {
                savePendingBookingId(bookingId)
            }

            const result = await createCheckout({
                booking_id: bookingId,
            })

            if (result.error) {
                if ('status' in result.error && result.error.status === 401) {
                    redirectToLogin()
                }

                return
            }

            if (result.data) {
                window.location.assign(result.data.checkout_url)
            }
        } finally {
            submittingRef.current = false
        }
    }

    const requestError = checkoutError ?? bookingError

    const isUnauthorized = requestError && 'status' in requestError && requestError.status === 401

    return {
        selectedSlot,
        matchingBookingId,
        isSubmitting,
        hasRequestError: Boolean(requestError && !isUnauthorized),
        handleSelectSlot,
        handleClose,
        submit,
    }
}
