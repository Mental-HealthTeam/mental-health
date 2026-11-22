import { useEffect, useState } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import {
    useCreateCheckoutMutation,
    useGetBookingRetryInfoQuery,
} from '../../../services/bookingsApi'

import { isExpiredCheckoutError } from '../utils/isExpiredCheckoutError'

const PAYMENT_SAFETY_WINDOW_MS = 2 * 60 * 1000
const BOOKING_POLLING_INTERVAL_MS = 10 * 1000

export const usePaymentCancel = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { i18n } = useTranslation()

    const [isLeavingForPayment, setIsLeavingForPayment] = useState(false)
    const [checkoutFailed, setCheckoutFailed] = useState(false)
    const [paymentExpired, setPaymentExpired] = useState(false)
    const [now, setNow] = useState(() => Date.now())

    const bookingId = searchParams.get('booking_id')
    const language: 'uk' | 'en' = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'uk'

    const {
        data: booking,
        isLoading,
        isError,
        refetch,
    } = useGetBookingRetryInfoQuery(bookingId ? { bookingId, lang: language } : skipToken, {
        pollingInterval: BOOKING_POLLING_INTERVAL_MS,
        skipPollingIfUnfocused: true,
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true,
        refetchOnReconnect: true,
    })

    const [createCheckout, { isLoading: isRedirecting }] = useCreateCheckoutMutation()

    const isPaymentLoading = isRedirecting || isLeavingForPayment

    const isPending = booking?.status === 'pending' && booking.payment_status === 'unpaid'

    const holdExpiresAt = booking?.hold_expires_at
        ? new Date(booking.hold_expires_at).getTime()
        : null

    const hasEnoughTime =
        holdExpiresAt !== null &&
        Number.isFinite(holdExpiresAt) &&
        holdExpiresAt - now > PAYMENT_SAFETY_WINDOW_MS

    const canRetry = Boolean(isPending && hasEnoughTime && !paymentExpired)

    useEffect(() => {
        if (holdExpiresAt === null || !Number.isFinite(holdExpiresAt)) {
            return
        }

        const deadline = holdExpiresAt - PAYMENT_SAFETY_WINDOW_MS
        const delay = deadline - Date.now()

        if (delay <= 0) {
            return
        }

        const timeout = window.setTimeout(() => {
            setNow(Date.now())
        }, delay + 50)

        return () => window.clearTimeout(timeout)
    }, [holdExpiresAt])

    useEffect(() => {
        const updateTime = () => {
            setNow(Date.now())
        }

        window.addEventListener('focus', updateTime)
        document.addEventListener('visibilitychange', updateTime)

        return () => {
            window.removeEventListener('focus', updateTime)
            document.removeEventListener('visibilitychange', updateTime)
        }
    }, [])

    const handleRetry = async () => {
        if (!booking || isPaymentLoading || paymentExpired) {
            return
        }

        const isStillAvailable =
            booking.status === 'pending' &&
            booking.payment_status === 'unpaid' &&
            holdExpiresAt !== null &&
            Number.isFinite(holdExpiresAt) &&
            holdExpiresAt - Date.now() > PAYMENT_SAFETY_WINDOW_MS

        if (!isStillAvailable) {
            setNow(Date.now())
            setPaymentExpired(true)
            refetch()
            return
        }

        setCheckoutFailed(false)

        try {
            const result = await createCheckout({
                booking_id: booking.booking_id,
            }).unwrap()

            setIsLeavingForPayment(true)

            window.location.assign(result.checkout_url)
        } catch (error) {
            setIsLeavingForPayment(false)

            if (isExpiredCheckoutError(error)) {
                setPaymentExpired(true)
                setNow(Date.now())
                setCheckoutFailed(false)
            } else {
                setCheckoutFailed(true)
            }

            refetch()
        }
    }

    const handleChooseAnotherTime = () => {
        if (!booking) {
            navigate('/catalog')
            return
        }

        navigate(`/psychologist-profile/${booking.psychologist.psychologist_id}`)
    }

    const handleBrowseSpecialists = () => {
        navigate('/catalog')
    }

    return {
        bookingId,
        booking,
        language,
        isLoading,
        isError,
        isPaymentLoading,
        checkoutFailed,
        canRetry,
        handleRetry,
        handleChooseAnotherTime,
        handleBrowseSpecialists,
    }
}
