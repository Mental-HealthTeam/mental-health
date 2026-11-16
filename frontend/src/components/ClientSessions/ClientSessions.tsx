import { useTranslation } from 'react-i18next'
import { ArrowIcon, SparkIcon } from '../UI/Icons'

import './ClientSessions.scss'
import { OutlineButton, PrimaryButton } from '../UI/Buttons'

type Props = {
    onStartAiSearch: () => void
    onOpenCatalog: () => void
}

export const ClientSessions = ({ onStartAiSearch, onOpenCatalog }: Props) => {
    const { t } = useTranslation('clientCabinet')

    return (
        <section className="client-sessions" aria-labelledby="client-sessions-title">
            <h2 className="client-sessions__title" id="client-sessions-title">
                {t('sessions.title')}
            </h2>

            <div className="client-sessions__empty">
                <p className="client-sessions__message">{t('sessions.empty')}</p>

                <div className="client-sessions__actions">
                    <PrimaryButton
                        className="client-sessions__ai-button"
                        startIcon={<SparkIcon />}
                        endIcon={<ArrowIcon />}
                        onClick={onStartAiSearch}
                    >
                        {t('sessions.aiSearch')}
                    </PrimaryButton>

                    <OutlineButton variant="secondary" onClick={onOpenCatalog}>
                        {t('sessions.catalog')}
                    </OutlineButton>
                </div>
            </div>
        </section>
    )
}
