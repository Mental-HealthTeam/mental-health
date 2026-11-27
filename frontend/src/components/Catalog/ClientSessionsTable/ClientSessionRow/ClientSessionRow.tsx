import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { SessionBooking } from '../../../../types/session'
import { Avatar } from '../../../UI/Avatar'
import { OutlineButton, PrimaryButton, SaveButton } from '../../../UI/Buttons'
import {
    formatSessionDateTime,
    getJoinUrl,
    getMeetingUrl,
    JOIN_BEFORE_START_MS,
} from '../clientSessionTime'

import './ClientSessionRow.scss'

const STATUS_KEYS = {
    confirmed: 'statuses.scheduled',
    pending: 'statuses.pending',
    completed: 'statuses.completed',
    declined: 'statuses.declined',
    cancelled: 'statuses.cancelled',
    disputed: 'statuses.disputed',
} as const satisfies Record<SessionBooking['status'], string>

type Props = {
    session: SessionBooking
    now: number
    isLoading: boolean
    saveDisabled: boolean
    showCompletedActions: boolean
    onOpenDetails: (session: SessionBooking) => void
    onSave: (bookingId: string, saved: boolean) => void
}

export const ClientSessionRow = ({
    session,
    now,
    isLoading,
    saveDisabled,
    showCompletedActions,
    onOpenDetails,
    onSave,
}: Props) => {
    const navigate = useNavigate()
    const { t, i18n } = useTranslation('clientCabinet', { keyPrefix: 'sessionsTable' })
    const language = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'uk'
    const isEnglish = language === 'en'

    const { booking_id, psychologist, selected_time, status, saved } = session
    const { date, time } = formatSessionDateTime(selected_time, language)
    const startsAt = Date.parse(selected_time)
    const canJoin = Boolean(getJoinUrl(session, now))
    const showJoinHint =
        Boolean(getMeetingUrl(session.meet_link)) && now < startsAt - JOIN_BEFORE_START_MS

    return (
        <tr className="client-sessions-table__row">
            <td>
                <div className="client-sessions-table__status">
                    <span className="client-sessions-table__check" aria-hidden="true">
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
                    {t(STATUS_KEYS[status])}
                </div>
            </td>

            <td>
                <div className="client-sessions-table__specialist">
                    <Avatar
                        isLoading={isLoading}
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
                <span className="client-sessions-table__value">{date}</span>
            </td>

            <td>
                <span className="client-sessions-table__value">{time}</span>
            </td>

            <td>
                {showCompletedActions && status === 'completed' ? (
                    <div className="client-sessions-table__actions">
                        <PrimaryButton
                            type="button"
                            onClick={() =>
                                navigate(`/psychologist-profile/${psychologist.psychologist_id}`)
                            }
                        >
                            {t('bookAgain', {
                                defaultValue: isEnglish ? 'Book again' : 'Повторити',
                            })}
                        </PrimaryButton>

                        <OutlineButton type="button" variant="secondary" disabled>
                            {t('leaveReview', {
                                defaultValue: isEnglish ? 'Leave a review' : 'Залишити відгук',
                            })}
                        </OutlineButton>
                    </div>
                ) : status === 'confirmed' ? (
                    <div className="client-sessions-table__actions">
                        <PrimaryButton
                            type="button"
                            className="client-sessions-table__join"
                            onClick={() => onOpenDetails(session)}
                        >
                            {t(canJoin ? 'join' : 'modal.title')}
                        </PrimaryButton>

                        {showJoinHint && (
                            <span className="client-sessions-table__hint">{t('joinHint')}</span>
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
                    isSaved={saved}
                    disabled={saveDisabled}
                    aria-label={t(saved ? 'unsave' : 'save', {
                        name: psychologist.full_name,
                        date,
                    })}
                    onClick={() => onSave(booking_id, !saved)}
                />
            </td>
        </tr>
    )
}
