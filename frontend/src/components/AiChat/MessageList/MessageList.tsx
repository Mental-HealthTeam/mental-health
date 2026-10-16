import { useEffect, useRef } from 'react'
import {
    GREETING_ID,
    searchPsychologists,
    sendUserMessage,
} from '../../../app/store/slices/aiChatSlice'
import classNames from 'classnames'
import { ChatMessage } from '../ChatMessage/ChatMessage'

import './MessageList.scss'
import { formatChatDate } from '../../../utils/formatChatDate'
import { TypingIndicator } from '../TypingIndicator/TypingIndicator'
import { Button } from '../../UI/Button'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { SpecialistCard } from '../../SpecialistCard'
import { useTranslation } from 'react-i18next'

type Props = {
    isTyping: boolean
    className?: string
}

export const MessageList = ({ isTyping, className }: Props) => {
    const { t } = useTranslation('aiChat')
    const { i18n } = useTranslation()

    const dispatch = useAppDispatch()
    const { messages, error, lastUserText, matchData, psychologists } = useAppSelector(
        (state) => state.aiChat,
    )
    const endRef = useRef<HTMLDivElement>(null)

    const firstCreatedAt = messages[0].createdAt

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages.length, isTyping, error])

    return (
        <div className={classNames('message-list', className)}>
            <time className="message-list__date" dateTime={new Date(firstCreatedAt).toISOString()}>
                {formatChatDate(firstCreatedAt, i18n.language)}
            </time>
            <div className="message-list__messages">
                {messages.map((item) => (
                    <ChatMessage
                        key={item.id}
                        message={item.id === GREETING_ID ? t('greeting') : item.message}
                        fromWho={item.fromWho}
                        className="message-list__message"
                    />
                ))}
            </div>

            {isTyping && <TypingIndicator />}

            {error && lastUserText && (
                <div className="message-list__error" role="alert">
                    <p>{error}</p>
                    <Button
                        className="message-list__button-try-again"
                        size="small"
                        variant="secondary"
                        ariaLabel={t('messageList.retry')}
                        onClick={() =>
                            dispatch(sendUserMessage({ text: lastUserText, retry: true }))
                        }
                    >
                        {t('messageList.retry')}
                    </Button>
                </div>
            )}

            {matchData?.ready_for_search && (
                <Button
                    className="message-list__button-search-psy"
                    ariaLabel={t('messageList.searchPsychologist')}
                    fullWidth
                    onClick={() => dispatch(searchPsychologists())}
                >
                    {t('messageList.searchPsychologist')}
                </Button>
            )}

            {psychologists.length > 0 && <SpecialistCard />}

            <div ref={endRef} />
        </div>
    )
}
