import { useEffect, useRef } from 'react'
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
    const { t, i18n } = useTranslation(['aiChat', 'errors'])
    const lang: 'uk' | 'en' = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'uk'

    const messages = useAppSelector((s) => s.aiChat.messages)
    const status = useAppSelector((s) => s.aiChat.status)
    const error = useAppSelector((s) => s.aiChat.error)
    const errorSource = useAppSelector((s) => s.aiChat.errorSource)
    const lastUserText = useAppSelector((s) => s.aiChat.lastUserText)
    const readyForSearch = useAppSelector((s) => s.aiChat.matchData?.ready_for_search)

    const dispatch = useAppDispatch()
    const endRef = useRef<HTMLDivElement>(null)

    const firstCreatedAt = messages[0].createdAt

    const isAnswering = status === 'waiting' || status === 'streaming'

    const errorText =
        error && errorSource
            ? t(`errors:${errorSource}.${error}`, {
                  defaultValue: t(`errors:${errorSource}.unknown`),
              })
            : null

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages.length, isAnswering, error])

    const handleRetry = () => {
        if (errorSource === 'search') {
            dispatch(searchPsychologists({ lang }))
        } else if (lastUserText) {
            dispatch(sendUserMessage({ text: lastUserText, retry: true }))
        }
    }

    return (
        <div className={classNames('message-list', className)}>
            <time className="message-list__date" dateTime={new Date(firstCreatedAt).toISOString()}>
                {formatChatDate(firstCreatedAt, i18n.language)}
            </time>

            <div className="message-list__messages">
                {messages.map((item) =>
                    item.kind === 'psychologists' ? (
                        <div className="message-list__specialists" key={item.id}>
                            {item.psychologists?.map((s) => (
                                <SpecialistCard key={s.psychologist_id} {...s} variant="compact" />
                            ))}
                        </div>
                    ) : (
                        <ChatMessage
                            key={item.id}
                            message={item.id === GREETING_ID ? t('greeting') : item.message}
                            fromWho={item.fromWho}
                            className="message-list__message"
                        />
                    ),
                )}
            </div>

            {readyForSearch && (
                <PrimaryButton
                    className="message-list__button-search-psy"
                    startIcon={<SparkIcon />}
                    endIcon={
                        <span className="message-list__search-arrow">
                            <ArrowIcon width={14} height={14} />
                        </span>
                    }
                    aria-label={t('messageList.searchPsychologist')}
                    disabled={isAnswering}
                    onClick={() => dispatch(searchPsychologists({ lang }))}
                >
                    <span className="message-list__search-label">
                        {t('messageList.searchPsychologist')}
                    </span>
                </PrimaryButton>
            )}

            {isAnswering && <TypingIndicator />}

            {errorText && (
                <div className="message-list__error" role="alert">
                    <span className="message-list__error-text">{errorText}</span>
                    <Button
                        className="message-list__button-try-again"
                        size="small"
                        variant="secondary"
                        ariaLabel={t('messageList.retry')}
                        onClick={handleRetry}
                    >
                        {t('messageList.retry')}
                    </Button>
                </div>
            )}

            <div ref={endRef} />
        </div>
    )
}
