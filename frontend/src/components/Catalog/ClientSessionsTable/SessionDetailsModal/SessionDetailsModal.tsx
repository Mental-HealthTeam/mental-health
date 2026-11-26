import { useTranslation } from 'react-i18next'

import { InfoTile } from '../../../InfoTile'
import { Avatar } from '../../../UI/Avatar'
import { OutlineButton, PrimaryButton } from '../../../UI/Buttons'
import { CalendarIcon, ClockCardIcon } from '../../../UI/Icons'
import { Modal } from '../../../UI/Modal'
import { VerifiedBadge } from '../../../UI/VerifiedBadge'

import './SessionDetailsModal.scss'

type Props = {
    open: boolean
    name: string
    avatarUrl: string | null
    date: string
    time: string
    canJoin: boolean
    onJoin: () => void
    onCancel: () => void
    onClose: () => void
    onExited: () => void
}

export const SessionDetailsModal = ({
    open,
    name,
    avatarUrl,
    date,
    time,
    canJoin,
    onJoin,
    onCancel,
    onClose,
    onExited,
}: Props) => {
    const { t } = useTranslation('clientCabinet', { keyPrefix: 'sessionsTable' })

    return (
        <Modal
            open={open}
            title={t('modal.title')}
            closeLabel={t('modal.close')}
            className="session-details-modal"
            onClose={onClose}
            onExited={onExited}
        >
            <div className="session-details-modal__card">
                <div className="session-details-modal__specialist">
                    <Avatar src={avatarUrl} alt="" size="large" shape="circle" />

                    <div className="session-details-modal__identity">
                        <strong className="session-details-modal__name">{name}</strong>
                        <VerifiedBadge />
                    </div>
                </div>

                <div className="session-details-modal__schedule">
                    <InfoTile
                        as="div"
                        icon={<CalendarIcon />}
                        label={t('columns.date')}
                        value={date}
                    />
                    <InfoTile
                        as="div"
                        icon={<ClockCardIcon />}
                        label={t('columns.time')}
                        value={time}
                    />
                </div>

                <PrimaryButton disabled={!canJoin} onClick={onJoin}>
                    {t('modal.join')}
                </PrimaryButton>

                <OutlineButton
                    variant="secondary"
                    className="session-details-modal__cancel"
                    onClick={onCancel}
                >
                    {t('modal.cancel')}
                </OutlineButton>
            </div>
        </Modal>
    )
}
