import type { MatchData, TypeData } from '../types/aiChat'

export class ChatApiError extends Error {}

const AI_URL = import.meta.env.VITE_AI_SERVICE_URL

type Handlers = {
    onContent: (text: string) => void
    onMatchData: (data: MatchData) => void
}

export const streamChatMessage = async (
    body: { session_id: string; message: string; tz_name: string },
    handlers: Handlers,
    signal: AbortSignal,
) => {
    const response = await fetch(`${AI_URL}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
    })

    if (!response.ok || !response.body) {
        throw new ChatApiError('Сервіс недоступний. Спробуйте ще раз.')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
        const { value, done } = await reader.read()

        if (done) {
            break
        }

        buffer += decoder.decode(value, { stream: true })

        const newParts = buffer.split('\n\n')

        buffer = newParts.pop() ?? ''

        for (const part of newParts) {
            if (!part.startsWith('data:')) {
                continue
            }

            const data: TypeData = JSON.parse(part.slice(5))

            if (data.error) {
                throw new ChatApiError('Анна не змогла відповісти.')
            }

            if (typeof data.content === 'string') {
                handlers.onContent(data.content)
            }

            if (data.match_data) {
                handlers.onMatchData(data.match_data)
            }
        }
    }
}
