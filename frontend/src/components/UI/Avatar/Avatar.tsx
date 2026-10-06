import classNames from 'classnames'

import './Avatar.scss'

export type AvatarSize = 'small' | 'medium' | 'large'

type Props = {
    src: string
    alt?: string
    size?: AvatarSize
    className?: string
}

export const Avatar = ({ src, alt = '', size = 'medium', className }: Props) => {
    return (
        <img
            className={classNames('avatar', `avatar--${size}`, className)}
            src={src}
            alt={alt}
            decoding="async"
        />
    )
}
