import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useAppDispatch } from '../../app/hooks'
import { requestBookingResume } from '../../app/store/slices/bookingSlice'
import { useCreateCheckoutMutation } from '../../services/bookingsApi'
import type { Booking } from '../../types/booking'

import { ModalLoadingFallback } from '../../components/UI/ModalLoadingFallback'

import { canContinuePayment } from './bookingResume.utils'

const ResumeBookingModal = lazy(() =>
    import('../../components/Booking/ResumeBookingModal').then((module) => ({
        default: module.ResumeBookingModal,
    })),
)

type Props = {
    bookings: Booking[]
    onClose: () => void
    onExpired: () => void
    onCheckoutReady: (checkoutUrl: string) => void
}

export const ResumeBookingFlow = ({ bookings, onClose, onExpired, onCheckoutReady }: Props) => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const { t } = useTranslation('specialistProfile')

    const submittingRef = useRef(false)

    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)

    const [createCheckout, { isLoading, error }] = useCreateCheckoutMutation()

    const activeBookings = bookings.filter(canContinuePayment)

    const selectedBooking =
        activeBookings.find((booking) => booking.booking_id === selectedBookingId) ?? null

    useEffect(() => {
        const checkExpiration = () => {
            if (submittingRef.current) {
                return
            }

            if (!bookings.some(canContinuePayment)) {
                onExpired()
            }
        }

        const timer = window.setInterval(checkExpiration, 1000)

        return () => {
            window.clearInterval(timer)
        }
    }, [bookings, onExpired])

    const handleSelectBooking = (bookingId: string) => {
        if (submittingRef.current) {
            return
        }

        setSelectedBookingId(bookingId)
    }

    const handleContinue = async () => {
        if (submittingRef.current || !selectedBooking) {
            return
        }

        if (!canContinuePayment(selectedBooking)) {
            return
        }

        submittingRef.current = true

        try {
            const result = await createCheckout({
                booking_id: selectedBooking.booking_id,
            })

            if (result.error) {
                if ('status' in result.error && result.error.status === 401) {
                    const returnPath = location.pathname + location.search + location.hash

                    dispatch(requestBookingResume(returnPath))

                    onClose()

                    navigate('/sign-in', {
                        state: { from: returnPath },
                    })
                }

                return
            }

            if (result.data) {
                onCheckoutReady(result.data.checkout_url)
            }
        } finally {
            submittingRef.current = false
        }
    }

    return (
        <Suspense
            fallback={
                <ModalLoadingFallback
                    loadingLabel={t('bookingModal.loading')}
                    closeLabel={t('bookingModal.close')}
                    onClose={onClose}
                />
            }
        >
            <ResumeBookingModal
                bookings={activeBookings}
                selectedBookingId={selectedBooking?.booking_id ?? null}
                onSelectBooking={handleSelectBooking}
                onClose={onClose}
                onContinue={handleContinue}
                isLoading={isLoading}
                error={error ? t('bookingModal.requestError') : null}
            />
        </Suspense>
    )
}
