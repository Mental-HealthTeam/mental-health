import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

import { PageLoadingOverlay } from '../../components/UI/PageLoadingOverlay'

import { BookingModalContext } from './booking-modal-context'
import type { OpenBookingModalOptions } from './booking-modal-context'
import { BookingSlotsFlow } from './BookingSlotsFlow'
import { ResumeBookingFlow } from './ResumeBookingFlow'
import { usePendingBookingResume } from './usePendingBookingResume'
import { useDraftBookingResume } from './useDraftBookingResume'
import type { BookingModalRequest } from './useDraftBookingResume'

type Request = BookingModalRequest & {
    instanceId: number
    locationKey: string
}

type Props = {
    children: ReactNode
}

export const BookingModalProvider = ({ children }: Props) => {
    const location = useLocation()
    const { t } = useTranslation('paymentCancel')

    const nextId = useRef(0)
    const redirectingRef = useRef(false)

    const [request, setRequest] = useState<Request | null>(null)
    const [paymentRedirectUrl, setPaymentRedirectUrl] = useState<string | null>(null)

    const activeRequest = request?.locationKey === location.key ? request : null

    const closeBookingModal = useCallback(() => {
        setRequest(null)
    }, [])

    const {
        user,
        isCheckingUser,
        isReturnPage,
        language,
        activeOffer,
        closeResumeModal,
        expireBooking,
    } = usePendingBookingResume({
        hasActiveModal: Boolean(activeRequest),
        onUserChange: closeBookingModal,
    })

    const handleCheckoutReady = useCallback(
        (checkoutUrl: string) => {
            if (redirectingRef.current) {
                return
            }

            redirectingRef.current = true

            setRequest(null)
            closeResumeModal()
            setPaymentRedirectUrl(checkoutUrl)
        },
        [closeResumeModal],
    )

    useEffect(() => {
        if (!paymentRedirectUrl) {
            return
        }

        const timeout = window.setTimeout(() => {
            window.location.assign(paymentRedirectUrl)
        }, 250)

        return () => {
            window.clearTimeout(timeout)
        }
    }, [paymentRedirectUrl])

    useEffect(() => {
        const handlePageHide = () => {
            redirectingRef.current = false
            setPaymentRedirectUrl(null)
        }

        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                redirectingRef.current = false
                setPaymentRedirectUrl(null)
            }
        }

        window.addEventListener('pagehide', handlePageHide)
        window.addEventListener('pageshow', handlePageShow)

        return () => {
            window.removeEventListener('pagehide', handlePageHide)
            window.removeEventListener('pageshow', handlePageShow)
        }
    }, [])

    const showBookingModal = useCallback(
        (options: BookingModalRequest) => {
            if (redirectingRef.current) {
                return
            }

            nextId.current += 1
            closeResumeModal()

            setRequest({
                ...options,
                instanceId: nextId.current,
                locationKey: location.key,
            })
        },
        [location.key, closeResumeModal],
    )

    const openBookingModal = useCallback(
        (options: OpenBookingModalOptions) => {
            showBookingModal(options)
        },
        [showBookingModal],
    )

    useDraftBookingResume({
        enabled: isReturnPage && Boolean(user) && !isCheckingUser && !paymentRedirectUrl,
        language,
        onResume: showBookingModal,
    })

    const contextValue = useMemo(
        () => ({
            openBookingModal,
            closeBookingModal,
        }),
        [openBookingModal, closeBookingModal],
    )

    return (
        <BookingModalContext.Provider value={contextValue}>
            {children}

            {!paymentRedirectUrl && activeRequest && (
                <BookingSlotsFlow
                    key={activeRequest.instanceId}
                    open
                    specialist={activeRequest.specialist}
                    slots={activeRequest.slots}
                    timeZone={activeRequest.timeZone}
                    initialSelectedTime={activeRequest.initialSelectedTime}
                    aiSessionId={activeRequest.aiSessionId}
                    onClose={closeBookingModal}
                    onCheckoutReady={handleCheckoutReady}
                />
            )}

            {!paymentRedirectUrl && !activeRequest && activeOffer && (
                <ResumeBookingFlow
                    key={activeOffer.booking.booking_id}
                    booking={activeOffer.booking}
                    onClose={closeResumeModal}
                    onExpired={expireBooking}
                    onCheckoutReady={handleCheckoutReady}
                />
            )}

            <PageLoadingOverlay
                open={Boolean(paymentRedirectUrl)}
                message={t('states.redirecting')}
            />
        </BookingModalContext.Provider>
    )
}
