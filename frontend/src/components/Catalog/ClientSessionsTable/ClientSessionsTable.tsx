import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AvatarFallbackIcon } from '../../UI/Icons'
import { OutlineButton, PrimaryButton, SaveButton, TagButton } from '../../UI/Buttons'
import { type ClientSession, clientSessionsMock } from './clientSessions.mock'

import './ClientSessionsTable.scss'

type Filter = 'all' | 'scheduled' | 'completed' | 'saved'

type Props = {
    onJoinSession?: (sessionId: string) => void
}

const PAGE_SIZE = 5

const filters: Filter[] = ['all', 'scheduled', 'completed', 'saved']

const getMeetingUrl = (value: string | null): string | null => {
    if (!value) {
        return null
    }

    try {
        const url = new URL(value)

        return url.protocol === 'https:' ? url.href : null
    } catch {
        return null
    }
}

export const ClientSessionsTable = ({ onJoinSession }: Props) => {
    const { t, i18n } = useTranslation('clientCabinet', {
        keyPrefix: 'sessionsTable',
    })

    const language = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'uk'

    const [activeFilter, setActiveFilter] = useState<Filter>('scheduled')
    const [sessions, setSessions] = useState<ClientSession[]>(clientSessionsMock)
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

    const scrollRef = useRef<HTMLDivElement>(null)
    const nextRowIndexRef = useRef<number | null>(null)

    const filteredSessions = sessions.filter((session) => {
        if (activeFilter === 'all') {
            return true
        }

        if (activeFilter === 'saved') {
            return session.isSaved
        }

        return session.status === activeFilter
    })

    const visibleSessions = filteredSessions.slice(0, visibleCount)
    const hasMoreSessions = visibleSessions.length < filteredSessions.length

    useLayoutEffect(() => {
        const container = scrollRef.current
        const rowIndex = nextRowIndexRef.current

        nextRowIndexRef.current = null

        if (!container || rowIndex === null) {
            return
        }

        const row = container.querySelectorAll<HTMLTableRowElement>('tbody tr')[rowIndex]

        if (!row) {
            return
        }

        const headerHeight = container.querySelector('thead')?.getBoundingClientRect().height ?? 0

        const top =
            container.scrollTop +
            row.getBoundingClientRect().top -
            container.getBoundingClientRect().top -
            headerHeight

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        container.scrollTo({
            top: Math.max(0, top),
            behavior: reduceMotion ? 'instant' : 'smooth',
        })
    }, [visibleCount])

    const changeFilter = (filter: Filter) => {
        if (filter === activeFilter) {
            return
        }

        nextRowIndexRef.current = null
        setActiveFilter(filter)
        setVisibleCount(PAGE_SIZE)

        scrollRef.current?.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant',
        })
    }

    const showMore = () => {
        nextRowIndexRef.current = visibleSessions.length
        setVisibleCount((current) => current + PAGE_SIZE)
    }

    const toggleSaved = (sessionId: string) => {
        setSessions((current) =>
            current.map((session) =>
                session.id === sessionId ? { ...session, isSaved: !session.isSaved } : session,
            ),
        )
    }

    const handleJoin = (session: ClientSession) => {
        const url = getMeetingUrl(session.meetLink)

        if (session.status !== 'scheduled' || !session.canJoin || !url) {
            return
        }

        window.open(url, '_blank', 'noopener,noreferrer')
        onJoinSession?.(session.id)
    }

    return (
        <section className="client-sessions-table">
            <h2 className="client-sessions-table__title">{t('title')}</h2>

            <div
                className="client-sessions-table__filters"
                role="group"
                aria-label={t('filtersLabel')}
            >
                {filters.map((filter) => (
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

            <div
                ref={scrollRef}
                className="client-sessions-table__scroll"
                role="region"
                aria-label={t('listLabel')}
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
                            const specialistName = session.specialistName[language]
                            const meetingUrl = getMeetingUrl(session.meetLink)
                            const canJoin = session.canJoin && meetingUrl !== null

                            return (
                                <tr key={session.id} className="client-sessions-table__row">
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

                                            {t(`statuses.${session.status}`)}
                                        </div>
                                    </td>

                                    <td>
                                        <div className="client-sessions-table__specialist">
                                            <span className="client-sessions-table__avatar">
                                                {session.avatarUrl ? (
                                                    <img src={session.avatarUrl} alt="" />
                                                ) : (
                                                    <AvatarFallbackIcon />
                                                )}
                                            </span>

                                            <span>{specialistName}</span>
                                        </div>
                                    </td>

                                    <td>
                                        <span className="client-sessions-table__value">
                                            {session.date}
                                        </span>
                                    </td>

                                    <td>
                                        <span className="client-sessions-table__value">
                                            {session.time}
                                        </span>
                                    </td>

                                    <td>
                                        {session.status === 'scheduled' ? (
                                            <div className="client-sessions-table__actions">
                                                <PrimaryButton
                                                    type="button"
                                                    className="client-sessions-table__join"
                                                    disabled={!canJoin}
                                                    onClick={() => handleJoin(session)}
                                                >
                                                    {t('join')}
                                                </PrimaryButton>

                                                {!canJoin && (
                                                    <span className="client-sessions-table__hint">
                                                        {t('joinHint')}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="client-sessions-table__hint">
                                                {t('completed')}
                                            </span>
                                        )}
                                    </td>

                                    <td>
                                        <SaveButton
                                            isSaved={session.isSaved}
                                            aria-label={t(session.isSaved ? 'unsave' : 'save', {
                                                name: specialistName,
                                                date: session.date,
                                            })}
                                            onClick={() => toggleSaved(session.id)}
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
        </section>
    )
}
