import type { Message, MessageAuthor } from '../app/store/slices/aiChatSlice'

export const createMessage = (message: string, fromWho: MessageAuthor): Message => ({
    id: crypto.randomUUID(),
    message,
    fromWho,
    createdAt: Date.now(),
})
