import { AnimatePresence, motion } from 'motion/react'
import { createPortal } from 'react-dom'
import { ChatHeader } from './ChatHeader/ChatHeader'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { addMessage, closeAiChat } from '../../app/store/slices/aiChatSlice'

import './AiChat.scss'
import { useEffect } from 'react'
import { createMessage } from '../../utils/createMessage'

export const AiChat = () => {
    const dispatch = useAppDispatch()
    const { isOpen } = useAppSelector((state) => state.aiChat)
    const handleClose = () => {
        if (isOpen) {
            dispatch(closeAiChat())
        }
    }

    useEffect(() => {
        dispatch(
            addMessage(
                createMessage(
                    'Доброго дня! Мене звати Анна, я твій ШІ-помічник “Mental Health Platform”. Розкажи, будь ласка, що тебе турбує — це допоможе швидше підібрати психолога, який підійде саме тобі.',
                    'bot',
                ),
            ),
        )
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
                    <ChatHeader onClose={handleClose} />
                    {/* <MessageList /> */}
                    {/* <ChatInput onSend={sendUserMessage} disabled={isTyping} /> */}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    )
}
