import { createApi } from '@reduxjs/toolkit/query/react'

import type { Booking, CreateBookingRequest } from '../types/booking'
import { baseQueryWithReauth } from './baseQueryWithReauth'

type CreateCheckoutRequest = {
    booking_id: string
}

type CreateCheckoutResponse = {
    session_id: string
    checkout_url: string
}

export const bookingsApi = createApi({
    reducerPath: 'bookingsApi',

    baseQuery: baseQueryWithReauth,

    endpoints: (builder) => ({
        createBooking: builder.mutation<Booking, CreateBookingRequest>({
            query: (body) => ({
                url: '/bookings',
                method: 'POST',
                body,
            }),
        }),

        createCheckout: builder.mutation<CreateCheckoutResponse, CreateCheckoutRequest>({
            query: (body) => ({
                url: '/payments/checkout',
                method: 'POST',
                body,
            }),
        }),
    }),
})

export const { useCreateBookingMutation, useCreateCheckoutMutation } = bookingsApi
