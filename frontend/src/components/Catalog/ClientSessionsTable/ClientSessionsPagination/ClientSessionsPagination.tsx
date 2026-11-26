import { useTranslation } from 'react-i18next'

import { OutlineButton } from '../../../UI/Buttons'

import './ClientSessionsPagination.scss'

type Props = {
    visible: number
    total: number
    onShowMore: () => void
}

export const ClientSessionsPagination = ({ visible, total, onShowMore }: Props) => {
    const { t } = useTranslation('clientCabinet', { keyPrefix: 'sessionsTable' })

    return (
        <div className="client-sessions-table__pagination">
            <p className="client-sessions-table__count" role="status" aria-atomic="true">
                {t('shown', { visible, total })}
            </p>

            {visible < total && (
                <OutlineButton type="button" variant="secondary" onClick={onShowMore}>
                    {t('showMore')}
                </OutlineButton>
            )}
        </div>
    )
}
