import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & {
    width?: number
    height?: number
}

export const CloseIcon = ({ width = 12, height = 12, ...props }: Props) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path d="M11 1L1 11M1 1L11 11" stroke="#3A5B4A" strokeWidth="2" strokeLinecap="round" />
        </svg>
    )
}
