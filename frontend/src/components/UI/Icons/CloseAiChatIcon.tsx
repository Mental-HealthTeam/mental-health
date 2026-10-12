import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement>

export const CloseAiChatIcon = ({ width = 18, height = 18, ...props }: Props) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                d="M11.15 6.35L8.75 8.75M8.75 8.75L6.35 11.15M8.75 8.75L6.35 6.35M8.75 8.75L11.15 11.15M16.75 8.75C16.75 13.1683 13.1683 16.75 8.75 16.75C4.33172 16.75 0.75 13.1683 0.75 8.75C0.75 4.33172 4.33172 0.75 8.75 0.75C13.1683 0.75 16.75 4.33172 16.75 8.75Z"
                strokeWidth="1.5"
                strokeLinecap="round"
                stroke="currentColor"
            />
        </svg>
    )
}
