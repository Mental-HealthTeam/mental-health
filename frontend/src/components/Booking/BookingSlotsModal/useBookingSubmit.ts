import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import {
    requestBookingResume,
    restoreBooking,
    setBookingDraft,
} from '../../../app/store/slices/bookingSlice'
import { updateSpecialistProfile } from '../../../app/store/slices/specialistProfileSlice'

import { useCreateBookingMutation, useCreateCheckoutMutation } from '../../../services/bookingsApi'
import { psychologistsApi } from '../../../services/psychologistsApi'

import type { CreateBookingRequest } from '../../../types/booking'

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
    onCheckoutReady: (checkoutUrl: string) => void
}

export const useBookingSubmit = ({
    psychologistId,
    initialSelectedTime,
    aiSessionId,
    onClose,
    onCheckoutReady,
}: Props) => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const location = useLocation()

    const profile = useAppSelector((state) => state.specialistProfile.profile)

    const submittingRef = useRef(false)

    const [selectedSlot, setSelectedSlot] = useState(() => initialSelectedTime || '')

    const [
        createBooking,
        { isLoading: isCreatingBooking, error: bookingError, reset: resetBooking },
    ] = useCreateBookingMutation()

    const [
        createCheckout,
        { isLoading: isCreatingCheckout, error: checkoutError, reset: resetCheckout },
    ] = useCreateCheckoutMutation()

    const isSubmitting = isCreatingBooking || isCreatingCheckout

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

    const removeBookedSlot = (bookedTime: string) => {
        if (profile?.psychologist_id === psychologistId) {
            dispatch(
                updateSpecialistProfile({
                    mock_slots: profile.mock_slots.filter(
                        (slot) => !isSameTime(slot.time, bookedTime),
                    ),
                }),
            )
        }

        const languages = ['uk', 'en'] as const

        languages.forEach((lang) => {
            dispatch(
                psychologistsApi.util.updateQueryData(
                    'getPsychologistById',
                    { id: psychologistId, lang },
                    (cachedProfile) => {
                        cachedProfile.mock_slots = cachedProfile.mock_slots.filter(
                            (slot) => !isSameTime(slot.time, bookedTime),
                        )
                    },
                ),
            )
        })
    }

    const submit = async (availableTime?: string) => {
        if (submittingRef.current || !availableTime) {
            return
        }

        submittingRef.current = true
        resetErrors()

        try {
            const nextDraft: CreateBookingRequest = {
                psychologist_id: psychologistId,
                selected_time: availableTime,
                ...(aiSessionId ? { ai_session_id: aiSessionId } : {}),
            }

            dispatch(setBookingDraft(nextDraft))

            const bookingResult = await createBooking(nextDraft)

            if (bookingResult.error) {
                if ('status' in bookingResult.error && bookingResult.error.status === 401) {
                    redirectToLogin()
                    return
                }

                if (
                    'status' in bookingResult.error &&
                    bookingResult.error.status === 409 &&
                    'data' in bookingResult.error &&
                    bookingResult.error.data &&
                    typeof bookingResult.error.data === 'object' &&
                    'code' in bookingResult.error.data &&
                    bookingResult.error.data.code === 'SLOT_ALREADY_BOOKED'
                ) {
                    const errorData = bookingResult.error.data as {
                        nearest_available_slot?: string | null
                    }

                    onClose()

                    navigate('/slot-unavailable', {
                        state: {
                            psychologistId,
                            nearestAvailableSlot: errorData.nearest_available_slot ?? null,
                        },
                    })

                    return
                }

                return
            }

            if (!bookingResult.data) {
                return
            }

            const booking = bookingResult.data

            // Бронирование успешно создано.
            // Сразу исключаем занятый слот из Redux и RTK Query.
            removeBookedSlot(booking.selected_time)

            // Сохраняем ID созданного бронирования в Redux
            // для текущего процесса оплаты.
            dispatch(restoreBooking(booking))

            // Создаём checkout только после успешного бронирования.
            const checkoutResult = await createCheckout({
                booking_id: booking.booking_id,
            })

            if (checkoutResult.error) {
                if ('status' in checkoutResult.error && checkoutResult.error.status === 401) {
                    redirectToLogin()
                }

                return
            }

            if (checkoutResult.data) {
                onCheckoutReady(checkoutResult.data.checkout_url)
            }
        } finally {
            submittingRef.current = false
        }
    }

    const requestError = checkoutError ?? bookingError

    const isUnauthorized = requestError && 'status' in requestError && requestError.status === 401

    return {
        selectedSlot,
        isSubmitting,
        hasRequestError: Boolean(requestError && !isUnauthorized),
        handleSelectSlot,
        handleClose,
        submit,
    }
}
