import { configureStore } from '@reduxjs/toolkit'

import { psychologistsApi } from '../../services/psychologistsApi'
import aiChatReducer from './slices/aiChatSlice'

export const store = configureStore({
    reducer: {
        aiChat: aiChatReducer,
        [psychologistsApi.reducerPath]: psychologistsApi.reducer,
    },

    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(psychologistsApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
