import classNames from 'classnames'
import { Avatar, type AvatarSize } from './Avatar'

import './Avatar.scss'

export type TypeAvatar = {
    src: string
    alt: string
    id: string
}

type Props = {
    avatars: TypeAvatar[]
    className?: string
    size?: AvatarSize
}

export const AvatarGroup = ({ avatars, className, size = 'medium' }: Props) => {
    return (
        <div className={classNames('avatar-group', className)} aria-hidden="true">
            {avatars.map((avatar) => (
                <Avatar
                    src={avatar.src}
                    alt={avatar.alt}
                    size={size}
                    key={avatar.id}
                    className="avatar-group__item"
                />
            ))}
        </div>
    )
}
