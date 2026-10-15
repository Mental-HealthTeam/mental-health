import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement>

export const ArrowTopIcon = ({ width = 12, height = 8, ...props }: Props) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 12 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                d="M2.04838 7.63468C1.57974 8.12177 0.820113 8.12177 0.351478 7.63468C-0.117159 7.14759 -0.117159 6.35805 0.351478 5.87096L6 -4.76995e-08L11.6485 5.87096C12.1172 6.35805 12.1172 7.14759 11.6485 7.63468C11.1799 8.12177 10.4203 8.12177 9.95162 7.63468L6 3.52745L2.04838 7.63468Z"
                fill="currentColor"
            />
        </svg>
    )
}
