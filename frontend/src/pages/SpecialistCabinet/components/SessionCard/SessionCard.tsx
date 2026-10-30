import type { ReactNode } from 'react'
import type { SessionStatus } from '../../../../types/session'
import avatar1 from '../../../../assets/avatars/avatar-1.png'
import classNames from 'classnames'

import './SessionCard.scss'
import { Avatar } from '../../../../components/UI/Avatar'
import { Tag } from '../../../../components/UI/Tag'
import { useTranslation } from 'react-i18next'
import { RadioIcon } from '../../../../components/UI/Icons'

type Props = {
    className?: string
    status: SessionStatus
    time: string
    clientName: string | null
    topics: string[]
    actions: ReactNode
    clientAvatarUrl: string | null
}

export const SessionCard = ({
    className,
    status,
    time,
    clientName,
    clientAvatarUrl,
    topics,
    actions,
}: Props) => {
    const { t } = useTranslation('session')

    return (
        <div className={classNames('session-card', className)}>
            <div className="session-card__status">
                <div
                    className={classNames('session-card__radio', {
                        'session-card__radio--completed': status === 'completed',
                        'session-card__radio--available': status === 'available',
                    })}
                >
                    <RadioIcon className="session-card__radio-icon" />
                </div>
                <span className="session-card__status-text">{t(`sessionStatus.${status}`)}</span>
            </div>
            <div className="session-card__time">{time}</div>
            <div className="session-card__client">
                <Avatar
                    src={clientAvatarUrl ? clientAvatarUrl : avatar1}
                    alt=""
                    size="small"
                    className="session-card__client-avatar-url"
                />
                <div className="session-card__client-name">{clientName}</div>
            </div>
            <div className="session-card__topics">
                {topics.map((topic) => (
                    <Tag key={topic} className="session-card__topic">
                        {topic}
                    </Tag>
                ))}
            </div>
            <div className="session-card__actions">{actions}</div>
        </div>
    )
}
