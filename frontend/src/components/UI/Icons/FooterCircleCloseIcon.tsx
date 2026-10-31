import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & {
    width?: number
    height?: number
}

export const FooterCircleCloseIcon = ({ width = 18, height = 18, ...props }: Props) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                d="M11.2502 6.74993L8.99999 9.00011M8.99999 9.00011L6.74981 11.2503M8.99999 9.00011L6.74981 6.74993M8.99999 9.00011L11.2502 11.2503M16.5006 9.00011C16.5006 13.1426 13.1425 16.5007 8.99999 16.5007C4.85752 16.5007 1.49939 13.1426 1.49939 9.00011C1.49939 4.85764 4.85752 1.49951 8.99999 1.49951C13.1425 1.49951 16.5006 4.85764 16.5006 9.00011Z"
                stroke="#F2F7EE"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    )
}
