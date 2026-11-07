import classNames from 'classnames'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import './MySessions.scss'
import type { SessionItem } from '../../../../types/session'
import { Tab } from '../../../../components/UI/Tab'
import { SessionCard } from '../SessionCard/SessionCard'
import { getSessionKey, getSessionStatus, isVisibleSession } from '../../../../utils/session'
import { formatDate } from '../../../../utils/date'

type Props = {
    className?: string
    sessions: SessionItem[]
}

type GroupSessions = {
    dayKey: string
    sessions: SessionItem[]
}

type ShowSessions = 'all' | 'available' | 'completed'

const FILTERS: ShowSessions[] = ['all', 'available', 'completed']

const getDayKey = (iso: string): string => {
    const date = new Date(iso)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}.${month}.${day}`
}

const getTime = (item: SessionItem): number => new Date(item.selected_time).getTime()

const groupSessionsByDate = (sessions: SessionItem[]): GroupSessions[] => {
    const groupedSessions: GroupSessions[] = []

    sessions.forEach((session) => {
        const dayKey = getDayKey(session.selected_time)
        const group = groupedSessions.find((item) => item.dayKey === dayKey)

        if (group) {
            group.sessions.push(session)
        } else {
            groupedSessions.push({ dayKey: dayKey, sessions: [session] })
        }
    })

    groupedSessions.forEach((group) => {
        group.sessions.sort((a, b) => getTime(a) - getTime(b))
    })

    return groupedSessions.sort((a, b) => b.dayKey.localeCompare(a.dayKey))
}

export const MySessions = ({ className, sessions }: Props) => {
    const { t, i18n } = useTranslation('session')
    const [showSessions, setShowSessions] = useState<ShowSessions>('all')

    const filteredSessions = useMemo(() => {
        const visible = sessions.filter(isVisibleSession)

        if (showSessions === 'all') {
            return visible
        }

        return visible.filter((session) => getSessionStatus(session) === showSessions)
    }, [showSessions, sessions])

    const groupedSessions = useMemo(() => groupSessionsByDate(filteredSessions), [filteredSessions])

    const todayKey = getDayKey(new Date().toISOString())

    return (
        <div className={classNames('my-sessions', className)}>
            <div className="my-sessions__heading">
                <h2 className="my-sessions__title">{t('title')}</h2>
            </div>

            <div className="my-sessions__filter-tabs">
                {FILTERS.map((filter) => (
                    <Tab
                        key={filter}
                        isActive={showSessions === filter}
                        className="my-sessions__item"
                        onClick={() => setShowSessions(filter)}
                    >
                        {t(`filters.${filter}`)}
                    </Tab>
                ))}
            </div>

            {groupedSessions.length !== 0 && (
                <div className="my-sessions__scroll">
                    <div className="my-sessions__days">
                        {groupedSessions.map((group) => {
                            const isToday = group.dayKey === todayKey
                            const dateLabel = formatDate(
                                group.sessions[0].selected_time,
                                i18n.language,
                            )

                            return (
                                <div className="my-sessions__day" key={group.dayKey}>
                                    <h3
                                        className={classNames('my-sessions__day-title', {
                                            'my-sessions__day-title--today': isToday,
                                        })}
                                    >
                                        {isToday ? t('today', { date: dateLabel }) : dateLabel}
                                    </h3>

                                    <div className="my-sessions__head" aria-hidden="true">
                                        <span>{t('tableHead.status')}</span>
                                        <span>{t('tableHead.time')}</span>
                                        <span>{t('tableHead.specialist')}</span>
                                        <span>{t('tableHead.request')}</span>
                                        <span>{t('tableHead.actions')}</span>
                                    </div>

                                    <div className="my-sessions__list">
                                        {group.sessions.map((session) => (
                                            <SessionCard
                                                key={getSessionKey(session)}
                                                className="my-sessions__session-card"
                                                session={session}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {groupedSessions.length === 0 && (
                <span className="my-sessions__no-sessions">{t('noSessions')}</span>
            )}
        </div>
    )
}
