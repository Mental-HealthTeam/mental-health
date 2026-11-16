import { createSlice } from '@reduxjs/toolkit'

type InitialState = {
    sessionExpired: boolean
}

const initialState: InitialState = {
    sessionExpired: false,
}

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        sessionExpired: (state) => {
            state.sessionExpired = true
        },
        sessionRestored: (state) => {
            state.sessionExpired = false
        },
    },
})

export const { sessionExpired, sessionRestored } = authSlice.actions

export const authReducer = authSlice.reducer
