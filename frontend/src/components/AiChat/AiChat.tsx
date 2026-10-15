import { AnimatePresence, motion } from 'motion/react'
import { createPortal } from 'react-dom'
import { ChatHeader } from './ChatHeader/ChatHeader'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { closeAiChat, sendUserMessage } from '../../app/store/slices/aiChatSlice'
import { useCallback, useEffect } from 'react'
import { MessageList } from './MessageList/MessageList'
import './AiChat.scss'
import { ChatInput } from './ChatInput/ChatInput'
import { useTranslation } from 'react-i18next'

export const AiChat = () => {
    const { t } = useTranslation('aiChat')
    const dispatch = useAppDispatch()
    const { isOpen, status, initialText } = useAppSelector((state) => state.aiChat)

    const handleClose = useCallback(() => {
        dispatch(closeAiChat())
    }, [dispatch])

    const handleSend = (text: string) => {
        dispatch(sendUserMessage({ text }))
    }

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose()
            }
        }

        window.addEventListener('keydown', handleEscape)

        return () => {
            window.removeEventListener('keydown', handleEscape)
        }
    }, [handleClose])

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="ai-chat"
                    role="dialog"
                    aria-label={t('window.ariaLabel')}
                    tabIndex={-1}
                    initial={{ opacity: 0, x: 90, scale: 0.86 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 90, scale: 0.86 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                    <div className="ai-chat__content">
                        <ChatHeader onClose={handleClose} />
                        <MessageList isTyping={status === 'streaming'} />

                        <ChatInput
                            onSend={handleSend}
                            disabled={status === 'streaming'}
                            initialValue={initialText}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    )
}
