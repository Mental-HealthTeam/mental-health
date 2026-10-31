import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & {
    width?: number
    height?: number
}

export const FooterEmailIcon = ({ width = 18, height = 18, ...props }: Props) => {
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
                d="M16.5006 5.25026L9.7568 9.54508C9.52795 9.67798 9.26801 9.74798 9.00337 9.74798C8.73872 9.74798 8.47878 9.67798 8.24993 9.54508L1.49939 5.25026M16.5006 5.25026V4.50034C16.5006 3.67199 15.829 3.00049 15.0005 3.00049H2.99951C2.17102 3.00049 1.49939 3.67199 1.49939 4.50034V5.25026M16.5006 5.25026V13.4994C16.5006 14.3278 15.829 14.9993 15.0005 14.9993H2.99951C2.17102 14.9993 1.49939 14.3278 1.49939 13.4994V5.25026"
                stroke="#F2F7EE"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    )
}
