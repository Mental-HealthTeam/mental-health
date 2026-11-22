import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

import { psychologistsApi } from '../../services/psychologistsApi'
import aiChatReducer from './slices/aiChatSlice'
import { specialistProfileReducer } from './slices/specialistProfileSlice'
import { authReducer } from './slices/authSlice'
import { authApi } from '../../services/authApi'
import { bookingReducer } from './slices/bookingSlice.ts'
import { bookingsApi } from '../../services/bookingsApi.ts'

export const store = configureStore({
    reducer: {
        aiChat: aiChatReducer,
        auth: authReducer,
        booking: bookingReducer,
        specialistProfile: specialistProfileReducer,
        [psychologistsApi.reducerPath]: psychologistsApi.reducer,
        [authApi.reducerPath]: authApi.reducer,
        [bookingsApi.reducerPath]: bookingsApi.reducer,
    },

    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            psychologistsApi.middleware,
            bookingsApi.middleware,
            authApi.middleware,
        ),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
