import classNames from 'classnames'
import type { Session, SessionStatus } from '../../../../types/session'
import { useMemo, useState } from 'react'
import { Tab } from '../../../../components/UI/Tab'

import './MySessions.scss'
import { OutlineButton } from '../../../../components/UI/Buttons'

type Props = {
    className?: string
    sessions: Session[]
}

type ShowSessions = 'all' | SessionStatus

export const MySessions = ({ className, sessions }: Props) => {
    const [showSessions, setShowSessions] = useState<ShowSessions>('all')

    const filteredSessions = useMemo(() => {
        if (showSessions === 'all') {
            return sessions
        }

        return sessions.filter((session) => session.status === showSessions)
    }, [showSessions, sessions])

    return (
        <div className={classNames('my-sessions', className)}>
            <div className="my-sessions__heading">
                <h2 className="my-sessions__title">Мої сесії</h2>
                <OutlineButton
                    className="my-sessions__button"
                    variant="secondary"
                    fullWidth
                    onClick={() => {}}
                >
                    Запланувати нові сесії
                </OutlineButton>
            </div>

            <div className="my-sessions__filter-tabs">
                <Tab
                    isActive={showSessions === 'all'}
                    className="profile-tabs__item"
                    onClick={() => setShowSessions('all')}
                >
                    Всі сесії
                </Tab>
                <Tab
                    isActive={showSessions === 'free'}
                    className="profile-tabs__item"
                    onClick={() => setShowSessions('free')}
                >
                    Вільні сесії
                </Tab>
                <Tab
                    isActive={showSessions === 'completed'}
                    className="profile-tabs__item"
                    onClick={() => setShowSessions('completed')}
                >
                    Завершені сесії
                </Tab>
            </div>

            {filteredSessions.map((session) => (
                <div className="my-sessions__session" key={session.id}>
                    {session.meet_link}
                </div>
            ))}
        </div>
    )
}
