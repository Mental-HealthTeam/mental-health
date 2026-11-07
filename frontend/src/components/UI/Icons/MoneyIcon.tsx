type Props = {
    className?: string
}

export const MoneyIcon = ({ className }: Props) => (
    <svg
        className={className}
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <rect
            x="0.5"
            y="0.5"
            width="35"
            height="35"
            rx="17.5"
            stroke="url(#money-gradient-border)"
        />

        <path
            d="M9 16V14C9 13.4696 9.21071 12.9609 9.58579 12.5858C9.96086 12.2107 10.4696 12 11 12H13M9 16C10.333 16 13 15.2 13 12M9 16V20M13 12H23M9 20V22C9 22.5304 9.21071 23.0391 9.58579 23.4142C9.96086 23.7893 10.4696 24 11 24H13M9 20C10.333 20 13 20.8 13 24M27 16V14C27 13.4696 26.7893 12.9609 26.4142 12.5858C26.0391 12.2107 25.5304 12 25 12H23M27 16C25.667 16 23 15.2 23 12M27 16V20M27 20V22C27 22.5304 26.7893 23.0391 26.4142 23.4142C26.0391 23.7893 25.5304 24 25 24H23M27 20C25.667 20 23 20.8 23 24M23 24H13"
            stroke="url(#money-gradient-icon)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />

        <path
            d="M20 18C20 19.1046 19.1046 20 18 20C16.8954 20 16 19.1046 16 18C16 16.8954 16.8954 16 18 16C19.1046 16 20 16.8954 20 18Z"
            stroke="url(#money-gradient-center)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />

        <defs>
            <linearGradient
                id="money-gradient-border"
                x1="-0.772532"
                y1="-2.78112"
                x2="42.5665"
                y2="38.0858"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopColor="#A9DB87" />
                <stop offset="1" stopColor="#47996D" />
            </linearGradient>

            <linearGradient
                id="money-gradient-icon"
                x1="8.61373"
                y1="11.073"
                x2="22.2567"
                y2="30.37"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopColor="#A9DB87" />
                <stop offset="1" stopColor="#47996D" />
            </linearGradient>

            <linearGradient
                id="money-gradient-center"
                x1="15.9142"
                y1="15.691"
                x2="20.7296"
                y2="20.2318"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopColor="#A9DB87" />
                <stop offset="1" stopColor="#47996D" />
            </linearGradient>
        </defs>
    </svg>
)
