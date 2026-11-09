import classNames from 'classnames'
import { useTranslation } from 'react-i18next'

import './SessionCard.scss'
import type { SessionItem } from '../../../../types/session'
import { Avatar } from '../../../../components/UI/Avatar'
import { RadioIcon } from '../../../../components/UI/Icons'
import { PrimaryButton } from '../../../../components/UI/Buttons'
import { getSessionStatus, isBooking } from '../../../../utils/session'
import { formatTime } from '../../../../utils/date'

type Props = {
    className?: string
    session: SessionItem
}

export const SessionCard = ({ className, session }: Props) => {
    const { t, i18n } = useTranslation('session')

    const status = getSessionStatus(session)
    const booking = isBooking(session) ? session : null
    const meetLink = booking?.meet_link ?? null

    const showJoinButton = status === 'scheduled' && meetLink !== null

    const handleJoin = () => {
        if (meetLink?.startsWith('https://')) {
            window.open(meetLink, '_blank', 'noopener,noreferrer')
        }
    }

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

            <div className="session-card__time">
                {formatTime(session.selected_time, i18n.language)}
            </div>

            <div className="session-card__client">
                {booking && (
                    <>
                        <Avatar
                            src={booking.client.avatar_url ?? ''}
                            alt=""
                            size="small"
                            className="session-card__client-avatar-url"
                        />
                        <div className="session-card__client-name">{booking.client.name}</div>
                    </>
                )}
            </div>

            <div className="session-card__actions">
                {showJoinButton && (
                    <PrimaryButton className="session-card__session-button" onClick={handleJoin}>
                        {t('join')}
                    </PrimaryButton>
                )}
            </div>
        </div>
    )
}