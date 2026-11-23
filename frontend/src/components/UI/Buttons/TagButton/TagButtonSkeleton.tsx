import { Skeleton } from '../../Skeleton'

type Props = {
    width?: number
    height?: number
}

export const TagButtonSkeleton = ({ width = 120, height = 36 }: Props) => (
    <Skeleton width={width} height={height} radius={18} />
)
