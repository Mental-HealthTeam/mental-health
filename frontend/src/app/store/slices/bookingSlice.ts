import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import type { Booking, CreateBookingRequest } from '../../../types/booking'

type BookingState = {
    draft: CreateBookingRequest | null
    bookingId: string | null
    resumeAfterLogin: boolean
    returnPath: string | null
}

const initialState: BookingState = {
    draft: null,
    bookingId: null,
    resumeAfterLogin: false,
    returnPath: null,
}

const bookingSlice = createSlice({
    name: 'booking',

    initialState,

    reducers: {
        setBookingDraft: (state, action: PayloadAction<CreateBookingRequest>) => {
            const nextDraft = action.payload

            const isSameBooking =
                state.draft?.psychologist_id === nextDraft.psychologist_id &&
                state.draft?.selected_time === nextDraft.selected_time &&
                state.draft?.ai_session_id === nextDraft.ai_session_id

            if (!isSameBooking) {
                state.bookingId = null
            }

            state.draft = nextDraft
            state.resumeAfterLogin = false
            state.returnPath = null
        },

        setBookingId: (state, action: PayloadAction<string>) => {
            state.bookingId = action.payload
        },

        restoreBooking: (state, action: PayloadAction<Booking>) => {
            const booking = action.payload

            state.bookingId = booking.booking_id

            state.draft = {
                psychologist_id: booking.psychologist.psychologist_id,
                selected_time: booking.selected_time,
                ...(booking.ai_session_id ? { ai_session_id: booking.ai_session_id } : {}),
            }

            state.resumeAfterLogin = false
            state.returnPath = null
        },

        requestBookingResume: (state, action: PayloadAction<string>) => {
            if (!state.draft) {
                return
            }

            state.resumeAfterLogin = true
            state.returnPath = action.payload
        },

        consumeBookingResume: (state) => {
            state.resumeAfterLogin = false
            state.returnPath = null
        },

        clearBookingDraft: () => ({
            ...initialState,
        }),
    },
})

export const {
    setBookingDraft,
    setBookingId,
    restoreBooking,
    requestBookingResume,
    consumeBookingResume,
    clearBookingDraft,
} = bookingSlice.actions

export const bookingReducer = bookingSlice.reducer
