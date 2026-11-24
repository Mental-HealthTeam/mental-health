import type { Message, MessageAuthor, MessageKind } from '../app/store/slices/aiChatSlice'
import type { Psychologist } from '../types/psychologist'

export const createMessage = (
    message: string,
    fromWho: MessageAuthor,
    kind?: MessageKind,
    psychologists?: Psychologist[],
): Message => ({
    id: crypto.randomUUID(),
    message,
    fromWho,
    createdAt: Date.now(),
    kind,
    psychologists,
})
