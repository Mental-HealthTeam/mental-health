import classNames from 'classnames'
import type { Session, SessionStatus } from '../../../../types/session'
import { useMemo, useState } from 'react'
import { Tab } from '../../../../components/UI/Tab'

import './MySessions.scss'
import { useTranslation } from 'react-i18next'
import { SessionCard } from '../SessionCard/SessionCard'
import { Button } from '../../../../components/UI/Button'
import { AvailabilityPopup } from '../AvailabilityPopup'
import { AnimatePresence, motion } from 'motion/react'
import { PrimaryButton } from '../../../../components/UI/Buttons'

type Props = {
    className?: string
    sessions: Session[]
}

type GroupSessions = {
    dayKey: string
    sessions: Session[]
}

type ShowSessions = 'all' | SessionStatus

const getDayKey = (iso: string): string => {
    const date = new Date(iso)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}.${month}.${day}`
}

const groupSessionsByDate = (sessions: Session[]): GroupSessions[] => {
    const groupedSessions: GroupSessions[] = []

    sessions.forEach((session) => {
        const dayKey = getDayKey(session.date)
        const group = groupedSessions.find((item) => item.dayKey === dayKey)

        if (group) {
            group.sessions.push(session)
        } else {
            groupedSessions.push({ dayKey: dayKey, sessions: [session] })
        }
    })

    groupedSessions.forEach((group) => {
        group.sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    })

    return groupedSessions.sort((a, b) => b.dayKey.localeCompare(a.dayKey))
}

const formatTime = (iso: string, locale: string): string =>
    new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(new Date(iso))

export const MySessions = ({ className, sessions }: Props) => {
    const { i18n } = useTranslation()
    const [showSessions, setShowSessions] = useState<ShowSessions>('all')
    const [showAvailabilityPopup, setShowAvailabilityPopup] = useState(false)

    const onCloseAvailabilityPopup = () => {
        setShowAvailabilityPopup(false)
    }

    const filteredSessions = useMemo(() => {
        if (showSessions === 'all') {
            return sessions
        }

        return sessions.filter((session) => session.status === showSessions)
    }, [showSessions, sessions])

    const groupedSessions = useMemo(() => groupSessionsByDate(filteredSessions), [filteredSessions])

    return (
        <div className={classNames('my-sessions', className)}>
            <div className="my-sessions__heading">
                <h2 className="my-sessions__title">Мої сесії</h2>
                <Button
                    className="my-sessions__button"
                    variant="secondary"
                    fullWidth
                    onClick={() => setShowAvailabilityPopup(true)}
                >
                    Запланувати нові сесії
                </Button>
                <AnimatePresence>
                    {showAvailabilityPopup && (
                        <motion.div
                            className="my-sessions__availability-popup"
                            role="region"
                            tabIndex={-1}
                            initial={{ opacity: 0, x: 50, y: -30, scale: 0.86 }}
                            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 50, y: -30, scale: 0.86 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                        >
                            <AvailabilityPopup
                                onCloseAvailabilityPopup={onCloseAvailabilityPopup}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="my-sessions__filter-tabs">
                <Tab
                    isActive={showSessions === 'all'}
                    className="my-sessions__item"
                    onClick={() => setShowSessions('all')}
                >
                    Всі сесії
                </Tab>
                <Tab
                    isActive={showSessions === 'available'}
                    className="my-sessions__item"
                    onClick={() => setShowSessions('available')}
                >
                    Вільні сесії
                </Tab>
                <Tab
                    isActive={showSessions === 'completed'}
                    className="my-sessions__item"
                    onClick={() => setShowSessions('completed')}
                >
                    Завершені сесії
                </Tab>
            </div>

            {groupedSessions.length !== 0 && (
                <div className="my-sessions__scroll">
                    <div className="my-sessions__days">
                        {groupedSessions.map((item) => {
                            const todayKey = getDayKey(new Date().toISOString())
                            const isToday = todayKey === item.dayKey

                            return (
                                <div className="my-sessions__day" key={item.dayKey}>
                                    <h3 className="my-sessions__day-title">
                                        {isToday ? `Сьогодні ${item.dayKey}` : item.dayKey}
                                    </h3>

                                    <div className="my-sessions__head" aria-hidden="true">
                                        <span>Статус сесії</span>
                                        <span>Час</span>
                                        <span>Інформація фахівця</span>
                                        <span>Запит</span>
                                        <span>Основні дії</span>
                                    </div>

                                    <div className="my-sessions__list">
                                        {item.sessions.map((session) => {
                                            const time = formatTime(session.date, i18n.language)

                                            return (
                                                <SessionCard
                                                    className="my-sessions__session-card"
                                                    actions={
                                                        <PrimaryButton
                                                            className="my-sessions__session-button"
                                                            onClick={() => {}}
                                                        >
                                                            Перейти до зустрічі
                                                        </PrimaryButton>
                                                    }
                                                    clientAvatarUrl={session.client_avatar_url}
                                                    clientName={session.client_name}
                                                    status={session.status}
                                                    time={time}
                                                    topics={session.topics}
                                                    key={session.id}
                                                />
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            {groupedSessions.length === 0 && (
                <span className="my-sessions__no-sessions">Немає сесій</span>
            )}
        </div>
    )
}
