import { useEffect, useMemo, useRef } from 'react'
import {
    GREETING_ID,
    searchPsychologists,
    sendUserMessage,
} from '../../../app/store/slices/aiChatSlice'
import classNames from 'classnames'
import { ChatMessage } from '../ChatMessage/ChatMessage'

import './MessageList.scss'
import { TypingIndicator } from '../TypingIndicator/TypingIndicator'
import { Button } from '../../UI/Button'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { useTranslation } from 'react-i18next'
import { SpecialistCard } from '../../SpecialistCard'
import { PrimaryButton } from '../../UI/Buttons'
import { ArrowIcon, SparkIcon } from '../../UI/Icons'
import { formatChatDate } from '../../../utils/date'

type Props = {
    className?: string
}

export const MessageList = ({ className }: Props) => {
    const { t } = useTranslation(['aiChat', 'errors'])
    const { i18n } = useTranslation()

    const dispatch = useAppDispatch()
    const { messages, error, errorSource, lastUserText, matchData, status, psychologists } =
        useAppSelector((state) => state.aiChat)
    const endRef = useRef<HTMLDivElement>(null)

    const firstCreatedAt = messages[0].createdAt

    const isAnswering = useMemo(() => status === 'waiting' || status === 'streaming', [status])

    const errorText =
        error && errorSource
            ? t(`errors:${errorSource}.${error}`, {
                  defaultValue: t(`errors:${errorSource}.unknown`),
              })
            : null

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages.length, isAnswering, error])

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

            {matchData?.ready_for_search && (
                <PrimaryButton
                    className="message-list__button-search-psy"
                    startIcon={<SparkIcon />}
                    endIcon={
                        <span className="message-list__search-arrow">
                            <ArrowIcon width={14} height={14} />
                        </span>
                    }
                    aria-label={t('messageList.searchPsychologist')}
                    onClick={() => dispatch(searchPsychologists())}
                >
                    <span className="message-list__search-label">
                        {t('messageList.searchPsychologist')}
                    </span>
                </PrimaryButton>
            )}

            {psychologists.length > 0 && (
                <div className="message-list__specialists">
                    {psychologists.map((specialist) => (
                        <SpecialistCard {...specialist} variant="compact" />
                    ))}
                </div>
            )}

            {isAnswering && <TypingIndicator />}

            {errorText && lastUserText && (
                <div className="message-list__error" role="alert">
                    <span className="message-list__error-text">{errorText}</span>
                    <Button
                        className="message-list__button-try-again"
                        size="small"
                        variant="secondary"
                        ariaLabel={t('messageList.retry')}
                        onClick={() => {
                            if (errorSource === 'message') {
                                dispatch(sendUserMessage({ text: lastUserText, retry: true }))
                            } else {
                                dispatch(searchPsychologists())
                            }
                        }}
                    >
                        {t('messageList.retry')}
                    </Button>
                </div>
            )}

            <div ref={endRef} />
        </div>
    )
}
