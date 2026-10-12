import type { SVGProps } from 'react'

export type ArrowDirection = 'left' | 'right' | 'up' | 'down'

type Props = SVGProps<SVGSVGElement> & {
    direction?: ArrowDirection
}

const ROTATION: Record<ArrowDirection, number> = {
    right: 0,
    down: 90,
    left: 180,
    up: 270,
}

export const ArrowIcon = ({
    direction = 'right',
    width = 11,
    height = 11,
    style,
    ...props
}: Props) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 11 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            style={{
                transform: `rotate(${ROTATION[direction]}deg)`,
                ...style,
            }}
            {...props}
        >
            <path
                d="M1 5.0838H9.1676M5.0838 9.1676L9.1676 5.0838L5.0838 1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    )
}
