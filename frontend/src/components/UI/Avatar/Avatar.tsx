import { useState } from 'react'
import type { ReactNode } from 'react'

import classNames from 'classnames'

import './Avatar.scss'

export type AvatarSize = 'small' | 'medium' | 'large'

type Props = {
    src?: string
    alt: string
    size?: AvatarSize
    className?: string
    fallback?: ReactNode
}

export const Avatar = ({ src, alt = '', size = 'medium', className, fallback }: Props) => {
    const [failedSrc, setFailedSrc] = useState<string | null>(null)

    const hasError = !!src && failedSrc === src

    if (!src || hasError) {
        return (
            <span
                className={classNames('avatar', `avatar--${size}`, 'avatar--fallback', className)}
                role="img"
                aria-label={alt}
            >
                {fallback}
            </span>
        )
    }

    return (
        <img
            className={classNames('avatar', `avatar--${size}`, className)}
            src={src}
            alt={alt}
            decoding="async"
            onError={() => setFailedSrc(src)}
        />
    )
}
