import { useEffect, useRef } from 'react'
import { searchPsychologists, sendUserMessage } from '../../../app/store/slices/aiChatSlice'
import classNames from 'classnames'
import { ChatMessage } from '../ChatMessage/ChatMessage'

import './MessageList.scss'
import { formatChatDate } from '../../../utils/formatChatDate'
import { TypingIndicator } from '../TypingIndicator/TypingIndicator'
import { Button } from '../../UI/Button'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'

type Props = {
    isTyping: boolean
    className?: string
}

export const MessageList = ({ isTyping, className }: Props) => {
    const dispatch = useAppDispatch()
    const { messages, error, lastUserText, matchData
      
     } = useAppSelector(
        (state) => state.aiChat,
    )
    const endRef = useRef<HTMLDivElement>(null)

    const firstCreatedAt = messages[0].createdAt

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages.length, isTyping])

    return (
        <div className={classNames('message-list', className)}>
            <time className="message-list__date" dateTime={new Date(firstCreatedAt).toISOString()}>
                {formatChatDate(firstCreatedAt)}
            </time>
            <div className="message-list__messages">
                {messages.map((item) => (
                    <ChatMessage
                        key={item.id}
                        message={item.message}
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
                        ariaLabel="Повторити запит"
                        onClick={() =>
                            dispatch(sendUserMessage({ text: lastUserText, retry: true }))
                        }
                    >
                        Спробувати ще раз
                    </Button>
                </div>
            )}

            {matchData?.ready_for_search && (
                <Button
                    className="message-list__button-search-psy"
                    ariaLabel="Підібрати психолога"
                    fullWidth
                    onClick={() => dispatch(searchPsychologists())}
                >
                    Підібрати психолога
                </Button>
            )}

            {/* {psychologists.length > 0 && <PsychologistList psychologists={psychologists} />} */}

            <div ref={endRef} />
        </div>
    )
}
