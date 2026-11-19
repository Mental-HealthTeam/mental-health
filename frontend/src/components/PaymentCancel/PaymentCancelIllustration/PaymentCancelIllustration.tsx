import './PaymentCancelIllustration.scss'

export const PaymentCancelIllustration = () => (
    <div className="payment-cancel-page__illustration" aria-hidden="true">
        <svg viewBox="0 0 240 150" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="120" cy="127" rx="66" ry="12" fill="#E3ECD8" />

            <ellipse cx="120" cy="117" rx="43" ry="15" fill="#BBC4B3" />

            <path
                d="M120 112C74 79 64 35 102 17C140 3 177 23 179 49C145 54 132 76 120 112Z"
                fill="#A9DB87"
            />

            <path
                d="M120 112C129 59 153 35 179 49"
                stroke="#4E9265"
                strokeWidth="3"
                strokeLinecap="round"
            />

            <path
                d="M123 112C138 73 170 61 194 76C213 88 210 110 199 121C176 102 148 105 123 112Z"
                fill="#91C178"
            />

            <path
                d="M123 112C153 91 178 96 199 121"
                stroke="#4E9265"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    </div>
)
