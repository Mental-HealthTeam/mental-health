import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { createMessage } from '../../../utils/createMessage'
import type { MatchData, Psychologist } from '../../../types/aiChat'
import type { RootState } from '../store'
import { streamChatMessage } from '../../../api/chatApi'

export type MessageAuthor = 'bot' | 'user'

export type Message = {
    id: string
    message: string
    fromWho: MessageAuthor
    createdAt: number
}

export type ChatError = {
    message: string
}

type InitialState = {
    isOpen: boolean
    status: 'idle' | 'waiting' | 'streaming'
    messages: Message[]
    sessionId: string
    lastActivity: number
    matchData: MatchData | null
    psychologists: Psychologist[]
    error: string | null
    lastUserText: string | null
    initialText: string
}

export const GREETING_ID = 'greeting'

const createGreeting = (): Message => ({
    id: GREETING_ID,
    message: '',
    fromWho: 'bot',
    createdAt: Date.now(),
})

const initialState: InitialState = {
    isOpen: false,
    status: 'idle',
    messages: [createGreeting()],
    sessionId: crypto.randomUUID(),
    lastActivity: Date.now(),
    matchData: null,
    psychologists: [],
    error: null,
    lastUserText: null,
    initialText: '',
}

export const aiChatSlice = createSlice({
    name: 'aiChat',
    initialState,
    reducers: {
        openAiChat: (state) => {
            state.isOpen = true
        },
        closeAiChat: (state) => {
            state.isOpen = false
        },
        addMessage: (state, action: PayloadAction<Message>) => {
            state.messages.push(action.payload)
        },
        removeMessage: (state, action: PayloadAction<string>) => {
            state.messages = state.messages.filter((message) => message.id !== action.payload)
        },
        requestStarted: (state, action: PayloadAction<string>) => {
            state.status = 'waiting'
            state.error = null
            state.lastUserText = action.payload
            state.lastActivity = Date.now()
        },
        botStartMessage: (state, action: PayloadAction<Message>) => {
            state.status = 'streaming'
            state.messages.push(action.payload)
        },
        botChunkReceived: (state, action: PayloadAction<{ id: string; chunk: string }>) => {
            const target = state.messages.find((message) => message.id === action.payload.id)

            if (target) {
                target.message += action.payload.chunk
            }
        },
        requestFinished: (state) => {
            state.status = 'idle'
            state.lastActivity = Date.now()
        },
        requestFailed: (state, action: PayloadAction<string>) => {
            state.status = 'idle'
            state.error = action.payload
        },
        setMatchData: (state, action: PayloadAction<MatchData>) => {
            state.matchData = action.payload
        },
        setPsychologists: (state, action: PayloadAction<Psychologist[]>) => {
            state.psychologists = action.payload
        },
        addInitialText: (state, action: PayloadAction<string>) => {
            state.initialText = action.payload
        },
        resetAiChat: (state) => {
            state.messages = [createGreeting()]
            state.sessionId = crypto.randomUUID()
            state.matchData = null
            state.psychologists = []
            state.error = null
            state.status = 'idle'
            state.lastActivity = Date.now()
        },
    },
})

export const {
    addMessage,
    botChunkReceived,
    closeAiChat,
    botStartMessage,
    openAiChat,
    removeMessage,
    requestFailed,
    requestFinished,
    requestStarted,
    resetAiChat,
    setMatchData,
    setPsychologists,
    addInitialText,
} = aiChatSlice.actions

export default aiChatSlice.reducer

export const sendUserMessage = createAsyncThunk<
    void,
    { text: string; retry?: boolean },
    { state: RootState }
>('aiChat/sendUserMessage', async ({ text, retry = false }, { dispatch, getState }) => {
    if (getState().aiChat.status !== 'idle') {
        return
    }

    if (!retry) {
        dispatch(addMessage(createMessage(text, 'user')))
    }

    dispatch(requestStarted(text))

    const { sessionId } = getState().aiChat
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 45_000)

    let botId: string | null = null

    try {
        await streamChatMessage(
            {
                session_id: sessionId,
                message: text,
                tz_name: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            {
                onContent: (chunk) => {
                    if (botId === null) {
                        clearTimeout(timer)

                        const botMessage = createMessage(chunk, 'bot')

                        botId = botMessage.id
                        dispatch(botStartMessage(botMessage))
                    } else {
                        dispatch(botChunkReceived({ id: botId, chunk }))
                    }
                },
                onMatchData: (data) => dispatch(setMatchData(data)),
            },
            controller.signal,
        )

        dispatch(requestFinished())
    } catch (error) {
        if (botId !== null) {
            dispatch(removeMessage(botId))
        }

        const message = error instanceof Error ? error.message : 'Упс. Щось пішло не так.'

        dispatch(requestFailed(message))
    } finally {
        clearTimeout(timer)
    }
})

const API_URL = import.meta.env.VITE_API_URL ?? ''

export const searchPsychologists = createAsyncThunk<void, void, { state: RootState }>(
    'aiChat/searchPsychologists',
    async (_, { dispatch, getState }) => {
        const { matchData, sessionId } = getState().aiChat

        const response = await fetch(`${API_URL}/api/matching/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                matching_info: { ...matchData, session_id: sessionId },
            }),
        })

        if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`)
        }

        const data = await response.json()

        dispatch(setPsychologists(data.result))
    },
)
