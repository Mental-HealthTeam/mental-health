import { useState } from 'react'
import classNames from 'classnames'

import { AvatarPlaceholderIcon } from '../Icons'
import { Skeleton } from '../Skeleton'

import './Avatar.scss'

export type AvatarSize = 'small' | 'medium' | 'large'
export type AvatarShape = 'rounded' | 'circle' | 'rectangle'

type Props = {
    src?: string | null
    alt: string
    isLoading?: boolean
    size?: AvatarSize
    shape?: AvatarShape
    fluid?: boolean
    className?: string
}

const AvatarContent = ({
    src,
    alt,
    isLoading = false,
    size = 'medium',
    shape = 'rounded',
    fluid = false,
    className,
}: Props) => {
    const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

    const showSkeleton = isLoading || (Boolean(src) && imageStatus === 'loading')
    const showFallback = !showSkeleton && (!src || imageStatus === 'error')

    return (
        <span
            className={classNames(
                'avatar',
                `avatar--${shape}`,
                {
                    [`avatar--${size}`]: !fluid,
                    'avatar--fluid': fluid,
                    'avatar--fallback': showFallback,
                },
                className,
            )}
            role="img"
            aria-label={alt}
            aria-busy={showSkeleton}
        >
            {showSkeleton && <Skeleton className="avatar__skeleton" />}

            {showFallback && (
                <span className="avatar__placeholder" aria-hidden="true">
                    <AvatarPlaceholderIcon className="avatar__placeholder-icon" />
                </span>
            )}

            {src && imageStatus !== 'error' && (
                <img
                    src={src}
                    alt=""
                    decoding="async"
                    onLoad={() => setImageStatus('loaded')}
                    onError={() => setImageStatus('error')}
                    className={classNames('avatar__image', {
                        'avatar__image--loaded': !showSkeleton && imageStatus === 'loaded',
                    })}
                />
            )}
        </span>
    )
}

export const Avatar = (props: Props) => <AvatarContent key={props.src ?? ''} {...props} />
