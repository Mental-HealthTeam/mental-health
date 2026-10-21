import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement>

export const MoneyIcon = ({ width = 24, height = 24, ...props }: Props) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                d="M3 10V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H7M3 10C4.333 10 7 9.2 7 6M3 10V14M7 6H17M3 14V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18H7M3 14C4.333 14 7 14.8 7 18M21 10V8C21 7.46957 20.7893 6.96086 20.4142 6.58579C20.0391 6.21071 19.5304 6 19 6H17M21 10C19.667 10 17 9.2 17 6M21 10V14M21 14V16C21 16.5304 20.7893 17.0391 20.4142 17.4142C20.0391 17.7893 19.5304 18 19 18H17M21 14C19.667 14 17 14.8 17 18M17 18H7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="url(#paint0_linear_1764_2772)"
            />
            <path
                d="M14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12Z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="url(#paint1_linear_1764_2772)"
            />
            <defs>
                <linearGradient
                    id="paint0_linear_1764_2772"
                    x1="2.61373"
                    y1="5.07296"
                    x2="16.2567"
                    y2="24.37"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#A9DB87" />
                    <stop offset="1" stopColor="#47996D" />
                </linearGradient>
                <linearGradient
                    id="paint1_linear_1764_2772"
                    x1="9.91416"
                    y1="9.69099"
                    x2="14.7296"
                    y2="14.2318"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#A9DB87" />
                    <stop offset="1" stopColor="#47996D" />
                </linearGradient>
            </defs>
        </svg>
    )
}
