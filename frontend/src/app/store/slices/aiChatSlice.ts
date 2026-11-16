import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { createMessage } from '../../../utils/createMessage'
import type { MatchData } from '../../../types/aiChat'
import type { RootState } from '../store'
import { streamChatMessage } from '../../../api/chatApi'
import type { Psychologist } from '../../../types/psychologist.ts'

export type MessageAuthor = 'bot' | 'user'

export type Message = {
    id: string
    message: string
    fromWho: MessageAuthor
    createdAt: number
}

export type ChatErrorCode = 'timeout' | 'empty' | 'noResults' | 'unknown'

type InitialState = {
    isOpen: boolean
    status: 'idle' | 'waiting' | 'streaming'
    messages: Message[]
    sessionId: string
    lastActivity: number
    matchData: MatchData | null
    psychologists: Psychologist[]
    lastUserText: string | null
    initialText: string
    error: ChatErrorCode | null
    errorSource: 'message' | 'search' | null
}

export const GREETING_ID = 'greeting'

const createGreeting = (): Message => ({
    id: GREETING_ID,
    message: '',
    fromWho: 'bot',
    createdAt: Date.now(),
})

const toErrorCode = (error: unknown): ChatErrorCode => {
    if (error instanceof DOMException && error.name === 'AbortError') return 'timeout'
    if (error instanceof Error && error.message === 'empty') return 'empty'

    return 'unknown'
}

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
    errorSource: null,
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
            state.errorSource = null
            state.lastUserText = action.payload
            state.lastActivity = Date.now()
        },
        searchStarted: (state) => {
            state.status = 'waiting'
            state.error = null
            state.errorSource = null
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
        requestFailed: (
            state,
            action: PayloadAction<{ message: ChatErrorCode; source: 'message' | 'search' }>,
        ) => {
            state.status = 'idle'
            state.error = action.payload.message
            state.errorSource = action.payload.source
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
            state.errorSource = null
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
    searchStarted,
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
    const timer = setTimeout(() => controller.abort(), 40_000)

    let botId: string | null = null

    const isStale = () => getState().aiChat.sessionId !== sessionId

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
                        const botMessage = createMessage(chunk, 'bot')

                        botId = botMessage.id
                        dispatch(botStartMessage(botMessage))
                    } else {
                        dispatch(botChunkReceived({ id: botId, chunk }))
                    }
                },
                onMatchData: (data) => {
                    if (!isStale()) dispatch(setMatchData(data))
                },
            },
            controller.signal,
        )

        if (isStale()) return
        if (botId === null) throw new Error('empty')

        dispatch(requestFinished())
    } catch (error) {
        if (isStale()) return
        if (botId !== null) dispatch(removeMessage(botId))

        dispatch(requestFailed({ message: toErrorCode(error), source: 'message' }))
    } finally {
        clearTimeout(timer)
    }
})

const API_URL = '/api'

export const searchPsychologists = createAsyncThunk<void, void, { state: RootState }>(
    'aiChat/searchPsychologists',
    async (_, { dispatch, getState }) => {
        const { matchData, sessionId } = getState().aiChat

        dispatch(searchStarted())

        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 40_000)

        try {
            const response = await fetch(`${API_URL}/matching/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                signal: controller.signal,
                body: JSON.stringify({
                    matching_info: { ...matchData, session_id: sessionId },
                }),
            })

            if (!response.ok) throw new Error('unknown')

            const data = await response.json()

            if (getState().aiChat.sessionId !== sessionId) return

            if (!data.result?.length) {
                dispatch(
                    requestFailed({
                        message: 'noResults',
                        source: 'search',
                    }),
                )
                return
            }

            dispatch(setPsychologists(data.result))
            dispatch(requestFinished())
        } catch (error) {
            dispatch(requestFailed({ message: toErrorCode(error), source: 'search' }))
        } finally {
            clearTimeout(timer)
        }
    },
)
