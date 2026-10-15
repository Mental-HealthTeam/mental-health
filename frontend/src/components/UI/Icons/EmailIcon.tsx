import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & {
    width?: number
    height?: number
}

export const EmailIcon = ({ width = 36, height = 36, ...props }: Props) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <rect width="36" height="36" rx="18" fill="url(#email-gradient)" />

            <path
                d="M26 13L18.8072 18.727C18.5631 18.9042 18.2859 18.9976 18.0036 18.9976C17.7213 18.9976 17.4441 18.9042 17.2 18.727L10 13M11.6 10H24.4C25.2837 10 26 10.8954 26 12V24C26 25.1046 25.2837 26 24.4 26H11.6C10.7163 26 10 25.1046 10 24V12C10 10.8954 10.7163 10 11.6 10Z"
                stroke="#F2F7EE"
                strokeWidth="2"
                strokeLinecap="round"
            />

            <defs>
                <linearGradient
                    id="email-gradient"
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
