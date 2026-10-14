import { useId } from 'react'

import type { IconProps } from './types'

export const BalanceIcon = ({ width = 14, height = 22, ...props }: IconProps) => {
    const gradientId = useId()

    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 14 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                d="M7 1C5.4087 1 3.88258 1.63214 2.75736 2.75736C1.63214 3.88258 1 5.4087 1 7C1 10.314 3.686 15 7 15C10.314 15 13 10.314 13 7C13 5.4087 12.3679 3.88258 11.2426 2.75736C10.1174 1.63214 8.5913 1 7 1ZM7 15C6.46957 15 5.96086 14.2625 5.58579 12.9497C5.21071 11.637 5 9.85652 5 8C5 6.14348 5.21071 4.36301 5.58579 3.05025C5.96086 1.7375 6.46957 1 7 1M7 15C7.53043 15 8.03914 14.2625 8.41421 12.9497C8.78929 11.637 9 9.85652 9 8C9 6.14348 8.78929 4.36301 8.41421 3.05025C8.03914 1.7375 7.53043 1 7 1M5 19C5 18.7348 5.10536 18.4804 5.29289 18.2929C5.48043 18.1054 5.73478 18 6 18H8C8.26522 18 8.51957 18.1054 8.70711 18.2929C8.89464 18.4804 9 18.7348 9 19V20C9 20.2652 8.89464 20.5196 8.70711 20.7071C8.51957 20.8946 8.26522 21 8 21H6C5.73478 21 5.48043 20.8946 5.29289 20.7071C5.10536 20.5196 5 20.2652 5 20V19Z"
                stroke={`url(#${gradientId})`}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            <defs>
                <linearGradient
                    id={gradientId}
                    x1="0.742489"
                    y1="-0.545064"
                    x2="21.4164"
                    y2="11.1517"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#91C178" />
                    <stop offset="1" stopColor="#4E9265" />
                </linearGradient>
            </defs>
        </svg>
    )
}
