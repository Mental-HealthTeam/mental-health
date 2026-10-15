import classNames from 'classnames'

import type { MessageAuthor } from '../../../app/store/slices/aiChatSlice'

import './ChatMessage.scss'

type Props = {
    className?: string
    message: string
    fromWho: MessageAuthor
}

export const ChatMessage = ({ className, message, fromWho }: Props) => {
    return (
        <div className={classNames('chat-message', `chat-message--${fromWho}`, className)}>
            <p className="chat-message__text">{message}</p>
        </div>
    )
}
