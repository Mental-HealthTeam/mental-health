import { Modal } from '../Modal'
import { Spinner } from '../Spinner'

import './ModalLoadingFallback.scss'

type Props = {
    open?: boolean
    onClose: () => void
    onExited?: () => void
    loadingLabel: string
    closeLabel: string
}

export const ModalLoadingFallback = ({
    open = true,
    onClose,
    onExited,
    loadingLabel,
    closeLabel,
}: Props) => (
    <Modal
        open={open}
        className="modal-loading-fallback"
        title={loadingLabel}
        closeLabel={closeLabel}
        onClose={onClose}
        onExited={onExited}
    >
        <div className="modal-loading-fallback__content" role="status">
            <Spinner />

            <span className="modal-loading-fallback__label">{loadingLabel}</span>
        </div>
    </Modal>
)
