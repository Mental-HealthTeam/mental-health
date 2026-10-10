import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type MessageAuthor = 'bot' | 'user'

export type Message = {
    id: string
    message: string
    fromWho: MessageAuthor
    createdAt: number
}

type InitialState = {
    isOpen: boolean
    isTyping: boolean
    messages: Message[]
}

const initialState: InitialState = {
    isOpen: false,
    isTyping: false,
    messages: [
        {
            id: 'hello-1',
            message: 'Hello!!',
            fromWho: 'bot',
            createdAt: 0,
        },
    ],
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
        toggleAiChat: (state) => {
            state.isOpen = !state.isOpen
        },
        addMessage: (state, { payload }: PayloadAction<Message>) => {
            state.messages.push(payload)
        },
    },
})

export const { openAiChat, closeAiChat, toggleAiChat, addMessage } = aiChatSlice.actions

export default aiChatSlice.reducer
