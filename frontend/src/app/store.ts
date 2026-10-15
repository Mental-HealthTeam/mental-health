import { configureStore } from '@reduxjs/toolkit'
import { psychologistsApi } from '../services/psychologistsApi.ts'

export const store = configureStore({
    reducer: {
        [psychologistsApi.reducerPath]: psychologistsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(psychologistsApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
