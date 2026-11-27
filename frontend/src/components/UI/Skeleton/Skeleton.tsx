import type { CSSProperties } from 'react'
import classNames from 'classnames'

import './Skeleton.scss'

type SkeletonSize = string | number

type Props = {
    width?: SkeletonSize
    height?: SkeletonSize
    radius?: SkeletonSize
    variant?: 'rectangle' | 'circle' | 'text'
    className?: string
}

const toCssSize = (value: SkeletonSize) => (typeof value === 'number' ? `${value}px` : value)

export const Skeleton = ({ width, height, radius, variant = 'rectangle', className }: Props) => {
    const style = {
        ...(width !== undefined && { width: toCssSize(width) }),
        ...(height !== undefined && { height: toCssSize(height) }),
        ...(radius !== undefined && { borderRadius: toCssSize(radius) }),
    } satisfies CSSProperties

    return (
        <span
            className={classNames('skeleton', `skeleton--${variant}`, className)}
            style={style}
            aria-hidden="true"
        />
    )
}
