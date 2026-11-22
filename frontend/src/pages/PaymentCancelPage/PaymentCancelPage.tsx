import { useTranslation } from 'react-i18next'

import { Container } from '../../components/Container'
import { Header } from '../../components/Header'
import { BackButton } from '../../components/UI/Buttons'
import { PageLoadingOverlay } from '../../components/UI/PageLoadingOverlay'
import { PaymentCancelContent } from '../../components/PaymentCancel'

import { usePaymentCancel } from './hooks/usePaymentCancel'

import './PaymentCancelPage.scss'

export const PaymentCancelPage = () => {
    const { t } = useTranslation('paymentCancel')
    const paymentCancel = usePaymentCancel()

    return (
        <div className="payment-cancel-page">
            <Header variant="page" />

            <main className="payment-cancel-page__main">
                <Container className="payment-cancel-page__container">
                    <BackButton className="payment-cancel-page__back" />

                    <PaymentCancelContent {...paymentCancel} />
                </Container>
            </main>

            <PageLoadingOverlay
                open={paymentCancel.isPaymentLoading}
                message={t('states.redirecting')}
            />
        </div>
    )
}
