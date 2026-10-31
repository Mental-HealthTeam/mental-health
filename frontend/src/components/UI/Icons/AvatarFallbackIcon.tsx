type Props = {
    className?: string
}

export const AvatarFallbackIcon = ({ className }: Props) => (
    <svg
        className={className}
        width="73"
        height="73"
        viewBox="0 0 73 73"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <circle cx="36.5" cy="36.5" r="36.5" fill="#F3F7EB" />

        <circle cx="36.5" cy="29" r="10" fill="#BEC5B5" />

        <path
            d="M19 52C22.8 43.8 28.6 40 36.5 40C44.4 40 50.2 43.8 54 52C48.8 56 42.9 58 36.5 58C30.1 58 24.2 56 19 52Z"
            fill="#BEC5B5"
        />
    </svg>
)
