import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

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
    const nextId = useRef(0)

    const [request, setRequest] = useState<Request | null>(null)

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

    const showBookingModal = useCallback(
        (options: BookingModalRequest) => {
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
        enabled: isReturnPage && Boolean(user) && !isCheckingUser,
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

            {activeRequest && (
                <BookingSlotsFlow
                    key={activeRequest.instanceId}
                    open
                    specialist={activeRequest.specialist}
                    slots={activeRequest.slots}
                    timeZone={activeRequest.timeZone}
                    initialSelectedTime={activeRequest.initialSelectedTime}
                    aiSessionId={activeRequest.aiSessionId}
                    onClose={closeBookingModal}
                />
            )}

            {!activeRequest && activeOffer && (
                <ResumeBookingFlow
                    key={activeOffer.booking.booking_id}
                    booking={activeOffer.booking}
                    onClose={closeResumeModal}
                    onExpired={expireBooking}
                />
            )}
        </BookingModalContext.Provider>
    )
}
