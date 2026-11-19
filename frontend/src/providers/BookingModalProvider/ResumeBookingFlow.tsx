import { lazy, Suspense, useEffect, useRef } from 'react'
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
    booking: Booking
    onClose: () => void
    onExpired: () => void
    onCheckoutReady: (checkoutUrl: string) => void
}

export const ResumeBookingFlow = ({ booking, onClose, onExpired, onCheckoutReady }: Props) => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const { t } = useTranslation('specialistProfile')

    const submittingRef = useRef(false)

    const [createCheckout, { isLoading, error }] = useCreateCheckoutMutation()

    useEffect(() => {
        const checkExpiration = () => {
            if (!submittingRef.current && !canContinuePayment(booking)) {
                onExpired()
            }
        }

        checkExpiration()

        const timer = window.setInterval(checkExpiration, 1000)

        return () => window.clearInterval(timer)
    }, [booking, onExpired])

    const handleContinue = async () => {
        if (submittingRef.current) {
            return
        }

        if (!canContinuePayment(booking)) {
            onExpired()
            return
        }

        submittingRef.current = true

        try {
            const result = await createCheckout({
                booking_id: booking.booking_id,
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
                booking={booking}
                onClose={onClose}
                onContinue={handleContinue}
                isLoading={isLoading}
                error={error ? t('bookingModal.requestError') : null}
            />
        </Suspense>
    )
}
