import { skipToken } from '@reduxjs/toolkit/query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

import { PageLoadingOverlay } from '../../components/UI/PageLoadingOverlay'
import { useGetPendingBookingsQuery } from '../../services/bookingsApi'
import { useGetPsychologistByIdQuery } from '../../services/psychologistsApi'
import type { Booking } from '../../types/booking'

import { BookingModalContext } from './booking-modal-context'
import type { OpenBookingModalOptions } from './booking-modal-context'
import { BookingSlotsFlow } from './BookingSlotsFlow'
import { ResumeBookingFlow } from './ResumeBookingFlow'
import { canContinuePayment } from './bookingResume.utils'
import { usePendingBookingResume } from './usePendingBookingResume'
import { useDraftBookingResume } from './useDraftBookingResume'
import type { BookingModalRequest } from './useDraftBookingResume'

const BOOKING_CHECK_INTERVAL = 5000
const BOOKING_POLLING_INTERVAL = 20000
const SLOTS_POLLING_INTERVAL = 20000

type Request = BookingModalRequest & {
    instanceId: number
    locationKey: string
}

type Props = {
    children: ReactNode
}

export const BookingModalProvider = ({ children }: Props) => {
    const location = useLocation()
    const { t, i18n } = useTranslation('paymentCancel')

    const nextId = useRef(0)
    const redirectingRef = useRef(false)

    const [request, setRequest] = useState<Request | null>(null)
    const [manualBookings, setManualBookings] = useState<Booking[] | null>(null)
    const [paymentRedirectUrl, setPaymentRedirectUrl] = useState<string | null>(null)
    const [now, setNow] = useState(() => Date.now())

    const activeRequest = request?.locationKey === location.key ? request : null

    const closeBookingModal = useCallback(() => {
        setRequest(null)
        setManualBookings(null)
    }, [])

    const { user, isCheckingUser, isReturnPage, language } = usePendingBookingResume({
        onUserChange: closeBookingModal,
    })

    const { data: pendingBookingsResponse, refetch: refetchPendingBookings } =
        useGetPendingBookingsQuery(user && !isCheckingUser ? undefined : skipToken, {
            refetchOnMountOrArgChange: true,
            refetchOnFocus: true,
            refetchOnReconnect: true,
        })

    const pendingBookings = useMemo(() => {
        const items = pendingBookingsResponse?.items ?? []

        return items.filter((booking) => {
            const expiresAt = booking.hold_expires_at ? Date.parse(booking.hold_expires_at) : NaN

            return (
                booking.status === 'pending' &&
                booking.payment_status === 'unpaid' &&
                Number.isFinite(expiresAt) &&
                expiresAt > now
            )
        })
    }, [pendingBookingsResponse, now])

    const hasPendingBookings = pendingBookings.length > 0

    const profileMatch = location.pathname.match(/^\/psychologist-profile\/([^/]+)\/?$/)

    const profilePsychologistId = profileMatch?.[1] ?? null

    const activePsychologistId = activeRequest?.specialist.psychologist_id ?? profilePsychologistId

    const { currentData: updatedSpecialist } = useGetPsychologistByIdQuery(
        activePsychologistId
            ? {
                  id: activePsychologistId,
                  lang: i18n.language,
              }
            : skipToken,
        {
            refetchOnMountOrArgChange: true,
            refetchOnFocus: true,
            refetchOnReconnect: true,
            pollingInterval: activePsychologistId ? SLOTS_POLLING_INTERVAL : 0,
            skipPollingIfUnfocused: true,
        },
    )

    const currentSpecialist =
        updatedSpecialist?.psychologist_id === activeRequest?.specialist.psychologist_id
            ? updatedSpecialist
            : activeRequest?.specialist

    const currentSlots =
        updatedSpecialist &&
        updatedSpecialist.psychologist_id === activeRequest?.specialist.psychologist_id
            ? updatedSpecialist.mock_slots
            : (activeRequest?.slots ?? [])

    useEffect(() => {
        if (!hasPendingBookings) {
            return
        }

        const interval = window.setInterval(() => {
            setNow(Date.now())
        }, BOOKING_CHECK_INTERVAL)

        return () => {
            window.clearInterval(interval)
        }
    }, [hasPendingBookings])

    useEffect(() => {
        if (!hasPendingBookings || !user || isCheckingUser) {
            return
        }

        const interval = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                void refetchPendingBookings()
            }
        }, BOOKING_POLLING_INTERVAL)

        return () => {
            window.clearInterval(interval)
        }
    }, [hasPendingBookings, user, isCheckingUser, refetchPendingBookings])

    const activeManualBookings = useMemo(() => {
        if (!manualBookings) {
            return []
        }

        const bookingIds = new Set(manualBookings.map((booking) => booking.booking_id))

        return pendingBookings.filter((booking) => bookingIds.has(booking.booking_id))
    }, [manualBookings, pendingBookings])

    const closePendingBookingModal = useCallback(() => {
        setManualBookings(null)
    }, [])

    const openPendingBookingModal = useCallback((bookings: Booking[]) => {
        if (redirectingRef.current) {
            return
        }

        const activeBookings = bookings.filter(canContinuePayment)

        if (activeBookings.length === 0) {
            return
        }

        setRequest(null)
        setManualBookings(activeBookings)
    }, [])

    const handleExpiredBooking = useCallback(() => {
        setManualBookings(null)
        void refetchPendingBookings()
    }, [refetchPendingBookings])

    const handleCheckoutReady = useCallback((checkoutUrl: string) => {
        if (redirectingRef.current) {
            return
        }

        redirectingRef.current = true

        setRequest(null)
        setManualBookings(null)
        setPaymentRedirectUrl(checkoutUrl)
    }, [])

    useEffect(() => {
        if (!paymentRedirectUrl) {
            return
        }

        window.location.assign(paymentRedirectUrl)
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

            setManualBookings(null)

            setRequest({
                ...options,
                instanceId: nextId.current,
                locationKey: location.key,
            })
        },
        [location.key],
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
            pendingBookings,
            openPendingBookingModal,
        }),
        [openBookingModal, closeBookingModal, pendingBookings, openPendingBookingModal],
    )

    return (
        <BookingModalContext.Provider value={contextValue}>
            {children}

            {!paymentRedirectUrl && activeRequest && (
                <BookingSlotsFlow
                    key={activeRequest.instanceId}
                    open
                    specialist={currentSpecialist ?? activeRequest.specialist}
                    slots={currentSlots}
                    timeZone={activeRequest.timeZone}
                    initialSelectedTime={activeRequest.initialSelectedTime}
                    aiSessionId={activeRequest.aiSessionId}
                    onClose={closeBookingModal}
                    onCheckoutReady={handleCheckoutReady}
                />
            )}

            {!paymentRedirectUrl && !activeRequest && activeManualBookings.length > 0 && (
                <ResumeBookingFlow
                    bookings={activeManualBookings}
                    onClose={closePendingBookingModal}
                    onExpired={handleExpiredBooking}
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
