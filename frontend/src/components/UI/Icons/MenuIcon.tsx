type Props = {
    isOpen?: boolean
    className?: string
}

export const MenuIcon = ({ isOpen = false, className }: Props) => {
    return (
        <svg
            className={className}
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            {isOpen ? (
                <>
                    <path
                        d="M8 8L20 20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />

                    <path
                        d="M20 8L8 20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </>
            ) : (
                <>
                    <path
                        d="M8 10H20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />

                    <path
                        d="M8 14H20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />

                    <path
                        d="M8 18H20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </>
            )}
        </svg>
    )
}
