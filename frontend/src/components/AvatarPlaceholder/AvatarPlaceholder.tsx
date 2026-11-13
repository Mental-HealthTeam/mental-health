import { AvatarPlaceholderIcon } from '../UI/Icons'

import './AvatarPlaceholder.scss'

type Props = {
    className: string
    variant: 'large' | 'medium' | 'small'
}

export const AvatarPlaceholder = ({ variant, className }: Props) => {
    return (
        <div className={`avatar-placeholder avatar-placeholder--${variant} ${className}`}>
            <AvatarPlaceholderIcon
                className={`avatar-placeholder__icon avatar-placeholder__icon--${variant}`}
            />
        </div>
    )
}
