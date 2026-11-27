import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'

import { OutlineButton } from '../../../UI/Buttons'
import { Modal } from '../../../UI/Modal'

import './CancelSessionModal.scss'

type Props = {
    retryBlocked: boolean
    open: boolean
    date: string
    time: string
    confirmNoRefund: boolean
    isCancelling: boolean
    error: string | null
    onConfirm: () => void
    onClose: () => void
    onExited: () => void
}

export const CancelSessionModal = ({
    retryBlocked,
    open,
    date,
    time,
    confirmNoRefund,
    isCancelling,
    error,
    onConfirm,
    onClose,
    onExited,
}: Props) => {
    const { t } = useTranslation('clientCabinet', {
        keyPrefix: 'sessionsTable.modal',
    })

    const reduceMotion = useReducedMotion()
    const actionsDisabled = !open || isCancelling
    const transition = {
        duration: reduceMotion ? 0 : 0.2,
        ease: 'easeOut' as const,
    }

    const message = confirmNoRefund ? t('noRefundMessage') : t('cancelMessage', { date, time })

    const confirmAction = confirmNoRefund ? 'cancelWithoutRefund' : 'cancel'
    const confirmLabel = t(isCancelling ? 'cancelling' : confirmAction)

    return (
        <Modal
            open={open}
            title={t('cancelTitle')}
            closeLabel={t('close')}
            className="cancel-session-modal"
            closeDisabled={actionsDisabled}
            onClose={onClose}
            onExited={onExited}
        >
            <div className="cancel-session-modal__content">
                <div>
                    <div aria-live="polite" aria-atomic="true">
                        <AnimatePresence initial={false} mode="wait">
                            <motion.p
                                key={confirmNoRefund ? 'no-refund' : 'confirm'}
                                className="cancel-session-modal__message"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={transition}
                            >
                                {message}
                            </motion.p>
                        </AnimatePresence>
                    </div>

                    <div role="alert">
                        {error && (
                            <motion.div
                                initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                transition={transition}
                                style={{ overflow: 'hidden' }}
                            >
                                <p>{error}</p>
                            </motion.div>
                        )}
                    </div>
                </div>

                <OutlineButton variant="secondary" disabled={actionsDisabled} onClick={onClose}>
                    {t('keep')}
                </OutlineButton>

                <OutlineButton
                    variant="secondary"
                    className="cancel-session-modal__confirm"
                    disabled={actionsDisabled || retryBlocked}
                    aria-busy={isCancelling}
                    onClick={onConfirm}
                >
                    {confirmLabel}
                </OutlineButton>
            </div>
        </Modal>
    )
}
