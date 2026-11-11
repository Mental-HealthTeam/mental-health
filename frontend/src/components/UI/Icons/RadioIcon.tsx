import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement>

export const RadioIcon = ({ width = 12, height = 9, ...props }: Props) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 12 9"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                d="M9.29271 0.292742C9.68309 -0.0976469 10.3162 -0.0975145 10.7068 0.292742C11.0972 0.683124 11.097 1.31621 10.7068 1.7068L4.71263 7.7068C4.32247 8.09729 3.68933 8.0976 3.29857 7.70778L0.293684 4.70778C-0.0970489 4.31771 -0.0980865 3.68461 0.291731 3.29372C0.681798 2.90299 1.31491 2.90195 1.70579 3.29177L4.00364 5.58473L9.29271 0.292742Z"
                fill="#FCFCFC"
            />
        </svg>
    )
}
