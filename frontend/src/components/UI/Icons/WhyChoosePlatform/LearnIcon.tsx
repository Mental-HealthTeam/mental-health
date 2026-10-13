import { useId } from 'react'

import type { IconProps } from './types'

export const LearnIcon = ({ width = 20, height = 20, ...props }: IconProps) => {
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
                d="M9.598 13C8.0067 13 6.48058 12.3679 5.35536 11.2426C4.23014 10.1174 3.598 8.5913 3.598 7C3.598 5.4087 4.23014 3.88258 5.35536 2.75736C6.48058 1.63214 8.0067 1 9.598 1C11.1893 1 12.7154 1.63214 13.8406 2.75736C14.9659 3.88258 15.598 5.4087 15.598 7C15.598 8.5913 14.9659 10.1174 13.8406 11.2426C12.7154 12.3679 11.1893 13 9.598 13ZM9.598 13L12.998 18.89L14.596 15.657L18.194 15.889L14.794 10M4.4 10L1 15.89L4.598 15.657L6.196 18.889L9.596 13"
                stroke={`url(#${gradientId})`}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            <defs>
                <linearGradient
                    id={gradientId}
                    x1="0.63103"
                    y1="-0.38206"
                    x2="22.1012"
                    y2="19.0758"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#91C178" />
                    <stop offset="1" stopColor="#4E9265" />
                </linearGradient>
            </defs>
        </svg>
    )
}
