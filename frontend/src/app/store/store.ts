import { configureStore } from '@reduxjs/toolkit'

import { psychologistsApi } from '../../services/psychologistsApi'
import aiChatReducer from './slices/aiChatSlice'
import { specialistProfileReducer } from './slices/specialistProfileSlice'

export const store = configureStore({
    reducer: {
        aiChat: aiChatReducer,
        specialistProfile: specialistProfileReducer,
        [psychologistsApi.reducerPath]: psychologistsApi.reducer,
    },

    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(psychologistsApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
