import { useState } from 'react'
import classNames from 'classnames'

import { AvatarPlaceholderIcon } from '../Icons'

import './Avatar.scss'

export type AvatarSize = 'small' | 'medium' | 'large'
export type AvatarShape = 'rounded' | 'circle' | 'rectangle'

type Props = {
    src?: string | null
    alt: string
    size?: AvatarSize
    shape?: AvatarShape
    fluid?: boolean
    className?: string
}

export const Avatar = ({
    src,
    alt,
    size = 'medium',
    shape = 'rounded',
    fluid = false,
    className,
}: Props) => {
    const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
    const [failedSrc, setFailedSrc] = useState<string | null>(null)

    const isLoaded = Boolean(src) && loadedSrc === src
    const hasError = Boolean(src) && failedSrc === src
    const showFallback = !src || !isLoaded || hasError

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
        >
            {showFallback && (
                <span className="avatar__placeholder" aria-hidden="true">
                    <AvatarPlaceholderIcon className="avatar__placeholder-icon" />
                </span>
            )}

            {src && !hasError && (
                <img
                    src={src}
                    alt=""
                    decoding="async"
                    onLoad={() => setLoadedSrc(src)}
                    onError={() => setFailedSrc(src)}
                    className={classNames('avatar__image', {
                        'avatar__image--loaded': isLoaded,
                    })}
                />
            )}
        </span>
    )
}
