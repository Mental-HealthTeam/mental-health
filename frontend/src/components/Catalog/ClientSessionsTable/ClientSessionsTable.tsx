import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useCancelBookingMutation } from '../../../services/bookingsApi'
import { useClientSessionsQuery } from '../../../services/clientCabinetApi'
import type { SessionBooking } from '../../../types/session'
import { ApiErrorResolver, type BookingCancellationErrorKey } from '../../../utils/ApiErrorResolver'
import { Avatar } from '../../UI/Avatar'
import { OutlineButton, PrimaryButton, SaveButton, TagButton } from '../../UI/Buttons'
import { CancelSessionModal } from './CancelSessionModal'
import { ClientSessionsTableSkeleton } from './ClientSessionsTableSkeleton'
import { SessionDetailsModal } from './SessionDetailsModal'

import './ClientSessionsTable.scss'

const FILTERS = ['all', 'scheduled', 'completed', 'saved'] as const
const PAGE_SIZE = 5
const JOIN_BEFORE_START_MS = 10 * 60_000
const SESSION_DURATION_MS = 50 * 60_000

type Filter = (typeof FILTERS)[number]
type SessionModal = 'details' | 'cancel'

type CancellationError = {
    messageKey: BookingCancellationErrorKey
    retryBlocked: boolean
}

type Props = {
    onJoinSession?: (sessionId: string) => void
}

const getMeetingUrl = (value: string | null): string | null => {
    if (!value) return null

    try {
        const url = new URL(value)
        return url.protocol === 'https:' ? url.href : null
    } catch {
        return null
    }
}

const getJoinUrl = (session: SessionBooking, now: number): string | null => {
    const startsAt = Date.parse(session.selected_time)

    if (
        session.status !== 'confirmed' ||
        !Number.isFinite(startsAt) ||
        now < startsAt - JOIN_BEFORE_START_MS ||
        now >= startsAt + SESSION_DURATION_MS
    ) {
        return null
    }

    return getMeetingUrl(session.meet_link)
}

export const ClientSessionsTable = ({ onJoinSession }: Props) => {
    const navigate = useNavigate()
    const { t, i18n } = useTranslation('clientCabinet', { keyPrefix: 'sessionsTable' })
    const { t: tApi } = useTranslation('clientCabinet', { keyPrefix: 'apiState' })
    const isEnglish = (i18n.resolvedLanguage ?? i18n.language).startsWith('en')
    const language = isEnglish ? 'en' : 'uk'

    const { currentData, isFetching, isError, refetch } = useClientSessionsQuery(undefined, {
        refetchOnMountOrArgChange: true,
    })
    const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation()

    const showSkeleton = isFetching && !currentData
    const showLoadError = isError && !currentData && !isFetching

    const [activeFilter, setActiveFilter] = useState<Filter>('scheduled')
    const [savedIds, setSavedIds] = useState<string[]>([])
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
    const [now, setNow] = useState(() => Date.now())
    const [selectedSession, setSelectedSession] = useState<SessionBooking | null>(null)
    const [sessionModal, setSessionModal] = useState<SessionModal>('details')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [confirmNoRefund, setConfirmNoRefund] = useState(false)
    const [cancelError, setCancelError] = useState<CancellationError | null>(null)

    const scrollRef = useRef<HTMLDivElement>(null)
    const nextRowIndexRef = useRef<number | null>(null)
    const nextModalRef = useRef<SessionModal | null>(null)
    const cancelInFlightRef = useRef(false)

    const dateFormatter = new Intl.DateTimeFormat(language, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
    const timeFormatter = new Intl.DateTimeFormat(language, {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    })

    const sessions = currentData?.items ?? []
    const liveSession = sessions.find(
        (session) => session.booking_id === selectedSession?.booking_id,
    )
    const modalSession = liveSession ?? selectedSession
    const modalStartsAt = modalSession ? Date.parse(modalSession.selected_time) : NaN
    const modalDate = Number.isFinite(modalStartsAt) ? dateFormatter.format(modalStartsAt) : '—'
    const modalTime = Number.isFinite(modalStartsAt) ? timeFormatter.format(modalStartsAt) : '—'
    const modalJoinUrl = liveSession ? getJoinUrl(liveSession, now) : null

    const filteredSessions = sessions.filter((session) => {
        switch (activeFilter) {
            case 'all':
                return true
            case 'scheduled':
                return session.status === 'confirmed'
            case 'completed':
                return session.status === 'completed'
            case 'saved':
                return savedIds.includes(session.booking_id)
        }
    })

    const visibleSessions = filteredSessions.slice(0, visibleCount)
    const hasMoreSessions = visibleSessions.length < filteredSessions.length

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
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'instant'
                : 'smooth',
        })
    }, [visibleCount])

    const changeFilter = (filter: Filter) => {
        if (filter === activeFilter) return

        nextRowIndexRef.current = null
        setActiveFilter(filter)
        setVisibleCount(PAGE_SIZE)
        scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }

    const showMore = () => {
        nextRowIndexRef.current = visibleSessions.length
        setVisibleCount((count) => count + PAGE_SIZE)
    }

    const toggleSaved = (bookingId: string) => {
        setSavedIds((ids) =>
            ids.includes(bookingId) ? ids.filter((id) => id !== bookingId) : [...ids, bookingId],
        )
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

    const switchSessionModal = (nextModal: SessionModal) => {
        if (!isModalOpen || cancelInFlightRef.current) return

        setConfirmNoRefund(false)
        setCancelError(null)
        nextModalRef.current = nextModal
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
            void refetch()
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

            <div
                className="client-sessions-table__filters"
                role="group"
                aria-label={t('filtersLabel')}
            >
                {FILTERS.map((filter) => (
                    <TagButton
                        key={filter}
                        type="button"
                        variant="black"
                        isSelected={activeFilter === filter}
                        onClick={() => changeFilter(filter)}
                    >
                        {t(`filters.${filter}`)}
                    </TagButton>
                ))}
            </div>

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
                    <OutlineButton type="button" variant="secondary" onClick={() => void refetch()}>
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

                        <tbody key={activeFilter}>
                            {visibleSessions.map((session) => {
                                const { booking_id, psychologist, selected_time, status } = session
                                const startsAt = Date.parse(selected_time)
                                const hasValidDate = Number.isFinite(startsAt)
                                const date = hasValidDate ? dateFormatter.format(startsAt) : '—'
                                const time = hasValidDate ? timeFormatter.format(startsAt) : '—'
                                const isScheduled = status === 'confirmed'
                                const statusLabel = isScheduled ? 'scheduled' : status
                                const isSaved = savedIds.includes(booking_id)
                                const canJoin = Boolean(getJoinUrl(session, now))
                                const showJoinHint =
                                    Boolean(getMeetingUrl(session.meet_link)) &&
                                    now < startsAt - JOIN_BEFORE_START_MS

                                return (
                                    <tr key={booking_id} className="client-sessions-table__row">
                                        <td>
                                            <div className="client-sessions-table__status">
                                                <span
                                                    className="client-sessions-table__check"
                                                    aria-hidden="true"
                                                >
                                                    <svg viewBox="0 0 16 16" fill="none">
                                                        <path
                                                            d="m4 8 2.5 2.5L12 5"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </span>
                                                {t(`statuses.${statusLabel}`)}
                                            </div>
                                        </td>

                                        <td>
                                            <div className="client-sessions-table__specialist">
                                                <Avatar
                                                    src={psychologist.avatar_url}
                                                    alt=""
                                                    size="small"
                                                    shape="circle"
                                                    className="client-sessions-table__avatar"
                                                />
                                                <span>{psychologist.full_name}</span>
                                            </div>
                                        </td>

                                        <td>
                                            <span className="client-sessions-table__value">
                                                {date}
                                            </span>
                                        </td>

                                        <td>
                                            <span className="client-sessions-table__value">
                                                {time}
                                            </span>
                                        </td>

                                        <td>
                                            {activeFilter === 'completed' ? (
                                                <div className="client-sessions-table__actions">
                                                    <PrimaryButton
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/psychologist-profile/${psychologist.psychologist_id}`,
                                                            )
                                                        }
                                                    >
                                                        {t('bookAgain', {
                                                            defaultValue: isEnglish
                                                                ? 'Book again'
                                                                : 'Повторити',
                                                        })}
                                                    </PrimaryButton>

                                                    <OutlineButton
                                                        type="button"
                                                        variant="secondary"
                                                        disabled
                                                    >
                                                        {t('leaveReview', {
                                                            defaultValue: isEnglish
                                                                ? 'Leave a review'
                                                                : 'Залишити відгук',
                                                        })}
                                                    </OutlineButton>
                                                </div>
                                            ) : isScheduled ? (
                                                <div className="client-sessions-table__actions">
                                                    <PrimaryButton
                                                        type="button"
                                                        className="client-sessions-table__join"
                                                        onClick={() => openSessionDetails(session)}
                                                    >
                                                        {t(canJoin ? 'join' : 'modal.title')}
                                                    </PrimaryButton>

                                                    {showJoinHint && (
                                                        <span className="client-sessions-table__hint">
                                                            {t('joinHint')}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="client-sessions-table__hint">
                                                    {status === 'completed' ? t('completed') : '—'}
                                                </span>
                                            )}
                                        </td>

                                        <td>
                                            <SaveButton
                                                isSaved={isSaved}
                                                aria-label={t(isSaved ? 'unsave' : 'save', {
                                                    name: psychologist.full_name,
                                                    date,
                                                })}
                                                onClick={() => toggleSaved(booking_id)}
                                            />
                                        </td>
                                    </tr>
                                )
                            })}

                            {filteredSessions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="client-sessions-table__empty">
                                        {t('empty')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredSessions.length > 0 && (
                <div className="client-sessions-table__pagination">
                    <p className="client-sessions-table__count" role="status" aria-atomic="true">
                        {t('shown', {
                            visible: visibleSessions.length,
                            total: filteredSessions.length,
                        })}
                    </p>

                    {hasMoreSessions && (
                        <OutlineButton type="button" variant="secondary" onClick={showMore}>
                            {t('showMore')}
                        </OutlineButton>
                    )}
                </div>
            )}

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
                        onCancel={() => switchSessionModal('cancel')}
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
