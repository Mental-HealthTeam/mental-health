import { AnimatePresence, motion } from 'motion/react'
import { createPortal } from 'react-dom'
import { ChatHeader } from './ChatHeader/ChatHeader'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { closeAiChat, sendUserMessage } from '../../app/store/slices/aiChatSlice'
import { useEffect } from 'react'
import { MessageList } from './MessageList/MessageList'
import './AiChat.scss'
import { ChatInput } from './ChatInput/ChatInput'

export const AiChat = () => {
    const dispatch = useAppDispatch()
    const { isOpen, status } = useAppSelector((state) => state.aiChat)

    const handleClose = () => {
        if (isOpen) {
            dispatch(closeAiChat())
        }
    }

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
    }, [])

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="ai-chat"
                    role="dialog"
                    aria-label="Чат з ШІ-консультантом"
                    tabIndex={-1}
                    initial={{ opacity: 0, x: 90, scale: 0.86 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 90, scale: 0.86 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                    <div className="ai-chat__content">
                        <ChatHeader onClose={handleClose} />
                        <MessageList isTyping={status === 'waiting'} />

                        <ChatInput
                            onSend={handleSend}
                            disabled={status === 'waiting'}
                            initialValue=""
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    )
}
