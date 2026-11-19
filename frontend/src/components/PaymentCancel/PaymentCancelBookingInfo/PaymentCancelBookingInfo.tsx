import './PaymentCancelBookingInfo.scss'

type Props = {
    psychologistName: string
    selectedTime: string
    price: string
    currency: string
    language: string
}

export const PaymentCancelBookingInfo = ({
    psychologistName,
    selectedTime,
    price,
    currency,
    language,
}: Props) => {
    const formattedDate = new Intl.DateTimeFormat(language, {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(selectedTime))

    const formattedPrice = new Intl.NumberFormat(language, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(Number(price))

    return (
        <div className="payment-cancel-page__booking">
            <span className="payment-cancel-page__booking-name">{psychologistName}</span>

            <span className="payment-cancel-page__separator">·</span>

            <time dateTime={selectedTime}>{formattedDate}</time>

            <span className="payment-cancel-page__separator">·</span>

            <span className="payment-cancel-page__booking-price">{formattedPrice}</span>
        </div>
    )
}
