import classNames from 'classnames'
import { Button } from '../../UI/Button'
import { CloseAiChatIcon } from '../../UI/Icons/CloseAiChatIcon'
import AvatarAi from '../../../assets/avatars/avatar-ai.png'
import { Avatar } from '../../UI/Avatar'

import './ChatHeader.scss'

type Props = {
    className?: string
    messages: string[]
    onClose: () => void
}

export const Message = ({ onClose, className }: Props) => {
    return (
        <header className={classNames('chat-header', className)}>
            <Button
                className="chat-header__close"
                variant="secondary"
                size="small"
                ariaLabel="Закрити чат"
                startIcon={<CloseAiChatIcon />}
                onClick={onClose}
            />

            <div className="chat-header__region-avatar-ai">
                <Avatar
                    src={AvatarAi}
                    alt="avatar-ai"
                    className="chat-header__avatar-ai"
                    size="large"
                />

                <div className="chat-header__info">
                    <h2 className="chat-header__name">Анна</h2>
                    <p className="chat-header__role">Твій ШІ-консультант</p>
                    <span className="chat-header__status">ONLINE</span>
                </div>
            </div>
        </header>
    )
}
