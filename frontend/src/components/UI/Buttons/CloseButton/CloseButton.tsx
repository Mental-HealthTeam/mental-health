import type { ComponentPropsWithoutRef } from 'react'
import classNames from 'classnames'

import './CloseButton.scss'
import { CloseAiChatIcon } from '../../Icons/CloseAiChatIcon.tsx'

type Props = Omit<ComponentPropsWithoutRef<'button'>, 'children' | 'aria-label'> & {
    'aria-label': string
    size?: 'small' | 'medium'
}

export const CloseButton = ({ className, size = 'medium', type = 'button', ...props }: Props) => (
    <button
        {...props}
        type={type}
        className={classNames('close-button', `close-button--${size}`, className)}
    >
        <CloseAiChatIcon width={18} height={18} />
    </button>
)
