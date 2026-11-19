import { useTranslation } from 'react-i18next'

import type { BookingRetryInfo } from '../../../types/bookingsApi'

import { PaymentCancelActions } from '../PaymentCancelActions'
import { PaymentCancelBookingCard } from '../PaymentCancelBookingCard'

import './PaymentCancelContent.scss'

type Props = {
    bookingId: string | null
    booking?: BookingRetryInfo
    language: string
    isLoading: boolean
    isError: boolean
    isPaymentLoading: boolean
    checkoutFailed: boolean
    canRetry: boolean
    handleRetry: () => void
    handleChooseAnotherTime: () => void
    handleBrowseSpecialists: () => void
}

export const PaymentCancelContent = ({
    bookingId,
    booking,
    isLoading,
    isError,
    isPaymentLoading,
    checkoutFailed,
    canRetry,
    handleRetry,
    handleChooseAnotherTime,
    handleBrowseSpecialists,
}: Props) => {
    const { t } = useTranslation('paymentCancel')

    const stateMessage = !bookingId
        ? t('errors.missingBooking')
        : isLoading
          ? t('states.loading')
          : isError || !booking
            ? t('errors.loadFailed')
            : null

    return (
        <>
            {stateMessage ? (
                <p className="payment-cancel-page__state" role={isLoading ? 'status' : 'alert'}>
                    {stateMessage}
                </p>
            ) : booking ? (
                <section className="payment-cancel-page__content">
                    <h1 className="payment-cancel-page__title">
                        {canRetry ? t('retry.title') : t('expired.title')}
                    </h1>

                    <p className="payment-cancel-page__description">
                        {canRetry ? t('retry.description') : t('expired.description')}
                    </p>

                    <PaymentCancelBookingCard booking={booking} expired={!canRetry} />

                    <PaymentCancelActions
                        canRetry={canRetry}
                        isPaymentLoading={isPaymentLoading}
                        onRetry={handleRetry}
                        onChooseAnotherTime={handleChooseAnotherTime}
                        onBrowseSpecialists={handleBrowseSpecialists}
                    />

                    {checkoutFailed && (
                        <p className="payment-cancel-page__checkout-error" role="alert">
                            {t('errors.checkoutFailed')}
                        </p>
                    )}
                </section>
            ) : null}
        </>
    )
}
