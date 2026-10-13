import { useId } from 'react'

import type { IconProps } from './types'

export const HelpIcon = ({ width = 20, height = 20, ...props }: IconProps) => {
    const gradientId = useId()

    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                d="M10 1L13 7L19 10L13 13L10 19L7 13L1 10L7 7L10 1Z"
                stroke={`url(#${gradientId})`}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            <defs>
                <linearGradient
                    id={gradientId}
                    x1="0.613734"
                    y1="-0.390558"
                    x2="22.2833"
                    y2="20.0429"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#91C178" />
                    <stop offset="1" stopColor="#4E9265" />
                </linearGradient>
            </defs>
        </svg>
    )
}
