import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { useCancelBookingMutation } from '../../../services/bookingsApi'
import {
    clientCabinetApi,
    useClientSessionsQuery,
    useSetSessionSavedMutation,
    type ClientSessionsFilter,
} from '../../../services/clientCabinetApi'
import type { SessionBooking } from '../../../types/session'
import { ApiErrorResolver, type BookingCancellationErrorKey } from '../../../utils/ApiErrorResolver'
import { OutlineButton } from '../../UI/Buttons'
import { CancelSessionModal } from './CancelSessionModal'
import { ClientSessionFilters } from './ClientSessionFilters'
import { ClientSessionRow } from './ClientSessionRow'
import { ClientSessionsPagination } from './ClientSessionsPagination'
import { ClientSessionsPanel } from './ClientSessionsPanel'
import { ClientSessionsTableSkeleton } from './ClientSessionsTableSkeleton'
import { formatSessionDateTime, getJoinUrl } from './clientSessionTime'
import { SessionDetailsModal } from './SessionDetailsModal'

import './ClientSessionsTable.scss'

const PAGE_SIZE = 5

type SessionModal = 'details' | 'cancel'

type CancellationError = {
    messageKey: BookingCancellationErrorKey
    retryBlocked: boolean
}

type Props = {
    onJoinSession?: (sessionId: string) => void
    isLoading: boolean
}

export const ClientSessionsTable = ({ onJoinSession, isLoading }: Props) => {
    const dispatch = useDispatch()
    const reduceMotion = Boolean(useReducedMotion())
    const { t, i18n } = useTranslation('clientCabinet', { keyPrefix: 'sessionsTable' })
    const { t: tApi } = useTranslation('clientCabinet', { keyPrefix: 'apiState' })
    const language = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'uk'

    const [activeFilter, setActiveFilter] = useState<ClientSessionsFilter>('scheduled')
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
    const [now, setNow] = useState(() => Date.now())
    const [selectedSession, setSelectedSession] = useState<SessionBooking | null>(null)
    const [sessionModal, setSessionModal] = useState<SessionModal>('details')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [confirmNoRefund, setConfirmNoRefund] = useState(false)
    const [cancelError, setCancelError] = useState<CancellationError | null>(null)

    const { currentData, isFetching, isError, refetch } = useClientSessionsQuery(activeFilter)
    const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation()
    const [
        setSessionSaved,
        { isLoading: isSavingSession, isError: hasSaveError, reset: resetSave },
    ] = useSetSessionSavedMutation()

    const scrollRef = useRef<HTMLDivElement>(null)
    const nextRowIndexRef = useRef<number | null>(null)
    const nextModalRef = useRef<SessionModal | null>(null)
    const cancelInFlightRef = useRef(false)

    const showSkeleton = isFetching && !currentData
    const showLoadError = isError && !currentData && !isFetching
    const panelState = currentData ? 'table' : showLoadError ? 'error' : 'loading'
    const sessions = currentData?.items ?? []
    const visibleSessions = sessions.slice(0, visibleCount)

    const liveSession = sessions.find(
        (session) => session.booking_id === selectedSession?.booking_id,
    )
    const modalSession = liveSession ?? selectedSession
    const { date: modalDate, time: modalTime } = formatSessionDateTime(
        modalSession?.selected_time,
        language,
    )
    const modalJoinUrl = liveSession ? getJoinUrl(liveSession, now) : null

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000)
        return () => window.clearInterval(timer)
    }, [])

    useLayoutEffect(() => {
        const container = scrollRef.current
        const rowIndex = nextRowIndexRef.current
        nextRowIndexRef.current = null

        if (!container || rowIndex === null) return

        const row = container.querySelectorAll('tbody tr')[rowIndex]
        if (!row) return

        const headerHeight = container.querySelector('thead')?.getBoundingClientRect().height ?? 0
        const top =
            container.scrollTop +
            row.getBoundingClientRect().top -
            container.getBoundingClientRect().top -
            headerHeight

        container.scrollTo({
            top: Math.max(0, top),
            behavior: reduceMotion ? 'instant' : 'smooth',
        })
    }, [reduceMotion, visibleCount])

    const changeFilter = (filter: ClientSessionsFilter) => {
        if (filter === activeFilter) return

        if (hasSaveError) resetSave()
        nextRowIndexRef.current = null
        setActiveFilter(filter)
        setVisibleCount(PAGE_SIZE)
        scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }

    const showMore = () => {
        nextRowIndexRef.current = visibleSessions.length
        setVisibleCount((count) => count + PAGE_SIZE)
    }

    const handleSave = (bookingId: string, saved: boolean) => {
        void setSessionSaved({ bookingId, saved })
    }

    const openSessionDetails = (session: SessionBooking) => {
        nextModalRef.current = null
        setConfirmNoRefund(false)
        setCancelError(null)
        setSelectedSession(session)
        setSessionModal('details')
        setIsModalOpen(true)
    }

    const closeSessionModal = () => {
        setIsModalOpen(false)
    }

    const openCancelModal = () => {
        if (!isModalOpen || cancelInFlightRef.current) return

        setConfirmNoRefund(false)
        setCancelError(null)
        nextModalRef.current = 'cancel'
        closeSessionModal()
    }

    const handleSessionModalExited = () => {
        const nextModal = nextModalRef.current
        nextModalRef.current = null

        if (nextModal) {
            setSessionModal(nextModal)
            setIsModalOpen(true)
            return
        }

        setSelectedSession(null)
    }

    const handleJoin = () => {
        if (!liveSession || !modalJoinUrl) return

        window.open(modalJoinUrl, '_blank', 'noopener,noreferrer')
        onJoinSession?.(liveSession.booking_id)
    }

    const handleCancelSession = async () => {
        if (
            !selectedSession ||
            !isModalOpen ||
            cancelInFlightRef.current ||
            cancelError?.retryBlocked
        ) {
            return
        }

        cancelInFlightRef.current = true

        try {
            await cancelBooking({
                bookingId: selectedSession.booking_id,
                confirmNoRefund,
            }).unwrap()

            closeSessionModal()
            dispatch(clientCabinetApi.util.invalidateTags(['ClientSessions']))
        } catch (error: unknown) {
            const resolution = ApiErrorResolver.forBookingCancellation(error)

            if (resolution.action === 'confirmNoRefund') {
                setCancelError(null)
                setConfirmNoRefund(true)
            } else {
                setCancelError({
                    messageKey: resolution.messageKey,
                    retryBlocked: resolution.retryBlocked,
                })
            }
        } finally {
            cancelInFlightRef.current = false
        }
    }

    return (
        <section className="client-sessions-table">
            <h2 className="client-sessions-table__title">{t('title')}</h2>

            <ClientSessionFilters activeFilter={activeFilter} onChange={changeFilter} />

            <ClientSessionsPanel
                panelKey={`${activeFilter}:${panelState}`}
                reduceMotion={reduceMotion}
            >
                {hasSaveError && <p role="alert">{t('saveError')}</p>}

                {showSkeleton && (
                    <div
                        className="client-sessions-table__scroll"
                        role="status"
                        aria-label={tApi('loading')}
                    >
                        <ClientSessionsTableSkeleton />
                    </div>
                )}

                {showLoadError && (
                    <div role="alert">
                        <p>{tApi('sessionsError')}</p>
                        <OutlineButton
                            type="button"
                            variant="secondary"
                            onClick={() => void refetch()}
                        >
                            {tApi('retry')}
                        </OutlineButton>
                    </div>
                )}

                {currentData && (
                    <div
                        ref={scrollRef}
                        className="client-sessions-table__scroll"
                        role="region"
                        aria-label={t('listLabel')}
                        aria-busy={isFetching}
                        tabIndex={0}
                    >
                        <table className="client-sessions-table__table">
                            <caption className="client-sessions-table__caption">
                                {t(`filters.${activeFilter}`)}
                            </caption>

                            <thead>
                                <tr>
                                    <th scope="col">{t('columns.status')}</th>
                                    <th scope="col">{t('columns.specialist')}</th>
                                    <th scope="col">{t('columns.date')}</th>
                                    <th scope="col">{t('columns.time')}</th>
                                    <th scope="col">{t('columns.actions')}</th>
                                    <th scope="col">
                                        <span className="client-sessions-table__caption">
                                            {t('columns.save')}
                                        </span>
                                    </th>
                                </tr>
                            </thead>

                            <motion.tbody
                                key={activeFilter}
                                initial={reduceMotion ? false : { opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: reduceMotion ? 0 : 0.16, ease: 'easeOut' }}
                            >
                                {visibleSessions.map((session) => (
                                    <ClientSessionRow
                                        key={session.booking_id}
                                        session={session}
                                        now={now}
                                        isLoading={isLoading}
                                        saveDisabled={isSavingSession || isFetching}
                                        showCompletedActions={activeFilter === 'completed'}
                                        onOpenDetails={openSessionDetails}
                                        onSave={handleSave}
                                    />
                                ))}

                                {sessions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="client-sessions-table__empty">
                                            {t('empty')}
                                        </td>
                                    </tr>
                                )}
                            </motion.tbody>
                        </table>
                    </div>
                )}

                {sessions.length > 0 && (
                    <ClientSessionsPagination
                        visible={visibleSessions.length}
                        total={sessions.length}
                        onShowMore={showMore}
                    />
                )}
            </ClientSessionsPanel>

            {modalSession &&
                (sessionModal === 'details' ? (
                    <SessionDetailsModal
                        open={isModalOpen}
                        name={modalSession.psychologist.full_name}
                        avatarUrl={modalSession.psychologist.avatar_url}
                        date={modalDate}
                        time={modalTime}
                        canJoin={Boolean(modalJoinUrl)}
                        onJoin={handleJoin}
                        onCancel={openCancelModal}
                        onClose={closeSessionModal}
                        onExited={handleSessionModalExited}
                    />
                ) : (
                    <CancelSessionModal
                        open={isModalOpen}
                        date={modalDate}
                        time={modalTime}
                        confirmNoRefund={confirmNoRefund}
                        isCancelling={isCancelling}
                        error={cancelError ? t(cancelError.messageKey) : null}
                        retryBlocked={cancelError?.retryBlocked ?? false}
                        onConfirm={() => void handleCancelSession()}
                        onClose={closeSessionModal}
                        onExited={handleSessionModalExited}
                    />
                ))}
        </section>
    )
}
