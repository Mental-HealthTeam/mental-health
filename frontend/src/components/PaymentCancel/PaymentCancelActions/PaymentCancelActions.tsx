import { useTranslation } from 'react-i18next'

import { PrimaryButton, OutlineButton } from '../../UI/Buttons'

import './PaymentCancelActions.scss'

type Props = {
    canRetry: boolean
    isPaymentLoading: boolean
    onRetry: () => void
    onChooseAnotherTime: () => void
    onBrowseSpecialists: () => void
}

export const PaymentCancelActions = ({
    canRetry,
    isPaymentLoading,
    onRetry,
    onChooseAnotherTime,
    onBrowseSpecialists,
}: Props) => {
    const { t } = useTranslation('paymentCancel')

    return (
        <div className="payment-cancel-page__actions">
            {canRetry ? (
                <PrimaryButton onClick={onRetry} disabled={isPaymentLoading}>
                    {isPaymentLoading ? t('states.redirecting') : t('retry.button')}
                </PrimaryButton>
            ) : (
                <PrimaryButton onClick={onChooseAnotherTime}>{t('expired.button')}</PrimaryButton>
            )}

            <OutlineButton
                variant="secondary"
                onClick={onBrowseSpecialists}
                disabled={isPaymentLoading}
            >
                {t('browseSpecialists')}
            </OutlineButton>
        </div>
    )
}
