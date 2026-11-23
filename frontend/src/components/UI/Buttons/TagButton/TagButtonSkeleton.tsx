import { Skeleton } from '../../Skeleton'

type Props = {
    width?: number
}

export const TagButtonSkeleton = ({ width = 120 }: Props) => (
    <Skeleton width={width} height={36} radius={18} />
)
