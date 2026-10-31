type Props = {
    className?: string
}

export const AwardIcon = ({ className }: Props) => (
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
            stroke="url(#award-gradient-border)"
        />

        <path
            d="M18.0003 21C16.409 21 14.8829 20.3679 13.7577 19.2426C12.6325 18.1174 12.0003 16.5913 12.0003 15C12.0003 13.4087 12.6325 11.8826 13.7577 10.7574C14.8829 9.63214 16.409 9 18.0003 9C19.5916 9 21.1178 9.63214 22.243 10.7574C23.3682 11.8826 24.0003 13.4087 24.0003 15C24.0003 16.5913 23.3682 18.1174 22.243 19.2426C21.1178 20.3679 19.5916 21 18.0003 21ZM18.0003 21L21.4003 26.89L22.9983 23.657L26.5963 23.889L23.1963 18M12.8023 18L9.40234 23.89L13.0003 23.657L14.5983 26.889L17.9983 21"
            stroke="url(#award-gradient-icon)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />

        <defs>
            <linearGradient
                id="award-gradient-border"
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
                id="award-gradient-icon"
                x1="9.03337"
                y1="7.61794"
                x2="30.5036"
                y2="27.0758"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopColor="#A9DB87" />
                <stop offset="1" stopColor="#47996D" />
            </linearGradient>
        </defs>
    </svg>
)
