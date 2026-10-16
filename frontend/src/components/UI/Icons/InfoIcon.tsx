import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & {
    width?: number
    height?: number
}

export const InfoIcon = ({ width = 36, height = 36, ...props }: Props) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <rect width="36" height="36" rx="18" fill="url(#info-gradient)" />

            <path
                d="M18 21.2V18M18 14.8H18.008M26 18C26 22.4183 22.4183 26 18 26C13.5817 26 10 22.4183 10 18C10 13.5817 13.5817 10 18 10C22.4183 10 26 13.5817 26 18Z"
                stroke="#F2F7EE"
                strokeWidth="2"
                strokeLinecap="round"
            />

            <defs>
                <linearGradient
                    id="info-gradient"
                    x1="-0.772532"
                    y1="-2.78112"
                    x2="42.5665"
                    y2="38.0858"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#A9DB87" />
                    <stop offset="1" stopColor="#47996D" />
                </linearGradient>
            </defs>
        </svg>
    )
}
