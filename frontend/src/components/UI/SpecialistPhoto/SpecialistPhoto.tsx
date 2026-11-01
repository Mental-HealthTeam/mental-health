import { useState, type ReactNode } from 'react'
import classNames from 'classnames'

import './SpecialistPhoto.scss'

type SpecialistPhotoProps = {
    src?: string | null
    alt: string
    className?: string
    fallback?: ReactNode
}

export const SpecialistPhoto = ({ src, alt, className, fallback }: SpecialistPhotoProps) => {
    const [failedSrc, setFailedSrc] = useState<string | null>(null)

    const hasError = !!src && failedSrc === src

    if (!src || hasError) {
        return (
            <div
                className={classNames('specialist-photo', 'specialist-photo--fallback', className)}
                role="img"
                aria-label={alt}
            >
                {fallback}
            </div>
        )
    }

    return (
        <img
            className={classNames('specialist-photo', className)}
            src={src}
            alt={alt}
            onError={() => setFailedSrc(src)}
        />
    )
}
