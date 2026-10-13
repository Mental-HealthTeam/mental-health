import classNames from 'classnames'
import { Button } from '../../UI/Button'
import { CloseAiChatIcon } from '../../UI/Icons/CloseAiChatIcon'
import AvatarAi from '../../../assets/avatars/avatar-ai.png'
import { Avatar } from '../../UI/Avatar'

import './ChatHeader.scss'
import { useTranslation } from 'react-i18next'

type Props = {
    className?: string
    onClose: () => void
}

export const ChatHeader = ({ onClose, className }: Props) => {
    const { t } = useTranslation('aiChat')

    return (
        <div className={classNames('chat-header', className)}>
            <Button
                className="chat-header__close"
                variant="secondary"
                size="small"
                ariaLabel={t('header.closeAriaLabel')}
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
                    <h2 className="chat-header__name">
                      {t('header.name')}
                    </h2>
                    <p className="chat-header__role">
                      {t('header.role')}
                    </p>
                    <span className="chat-header__status">
                      {t('header.status')}
                    </span>
                </div>
            </div>
        </div>
    )
}
