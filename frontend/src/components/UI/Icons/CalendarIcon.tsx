import { useId } from 'react'
import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & {
    width?: number
    height?: number
}

export const CalendarIcon = ({ width = 36, height = 36, ...props }: Props) => {
    const id = useId()
    const borderGradientId = `${id}-border`
    const calendarGradientId = `${id}-calendar`

    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <rect
                x="0.5"
                y="0.5"
                width="35"
                height="35"
                rx="17.5"
                stroke={`url(#${borderGradientId})`}
            />

            <path
                d="M22 9V13M14 9V13M10 17H26M17 21H18V24M10 13C10 12.4696 10.2107 11.9609 10.5858 11.5858C10.9609 11.2107 11.4696 11 12 11H24C24.5304 11 25.0391 11.2107 25.4142 11.5858C25.7893 11.9609 26 12.4696 26 13V25C26 25.5304 25.7893 26.0391 25.4142 26.4142C25.0391 26.7893 24.5304 27 24 27H12C11.4696 27 10.9609 26.7893 10.5858 26.4142C10.2107 26.0391 10 25.5304 10 25V13Z"
                stroke={`url(#${calendarGradientId})`}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            <defs>
                <linearGradient
                    id={borderGradientId}
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
                    id={calendarGradientId}
                    x1="9.65665"
                    y1="7.60944"
                    x2="31.0297"
                    y2="25.5241"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#A9DB87" />
                    <stop offset="1" stopColor="#47996D" />
                </linearGradient>
            </defs>
        </svg>
    )
}
