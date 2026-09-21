type Props = {
    isOpen?: boolean
    className?: string
}

export const MenuIcon = ({
                             isOpen = false,
                             className,
                         }: Props) => {
    return (
        <svg
            className={className}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            {isOpen ? (
                <>
                    <path
                        d="M6 6L18 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />

                    <path
                        d="M18 6L6 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </>
            ) : (
                <>
                    <path
                        d="M4 7H20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />

                    <path
                        d="M4 12H20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />

                    <path
                        d="M4 17H20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </>
            )}
        </svg>
    )
}
