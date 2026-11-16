import { configureStore } from '@reduxjs/toolkit'

import { psychologistsApi } from '../../services/psychologistsApi'
import aiChatReducer from './slices/aiChatSlice'
import { specialistProfileReducer } from './slices/specialistProfileSlice'
import { authReducer } from './slices/authSlice'
import { authApi } from '../../services/authApi'

export const store = configureStore({
    reducer: {
        aiChat: aiChatReducer,
        auth: authReducer,
        specialistProfile: specialistProfileReducer,
        [psychologistsApi.reducerPath]: psychologistsApi.reducer,
        [authApi.reducerPath]: authApi.reducer,
    },

    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(psychologistsApi.middleware, authApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
