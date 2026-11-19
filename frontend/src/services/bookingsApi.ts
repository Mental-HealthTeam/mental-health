import { createApi } from '@reduxjs/toolkit/query/react'

import type { Booking, CreateBookingRequest } from '../types/booking'
import { baseQueryWithReauth } from './baseQueryWithReauth'
import type { BookingRetryInfo } from '../types/bookingsApi.ts'

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
        getBookingRetryInfo: builder.query<
            BookingRetryInfo,
            { bookingId: string; lang: 'uk' | 'en' }
        >({
            query: ({ bookingId, lang }) => ({
                url: `/bookings/${bookingId}/retry-info`,
                method: 'GET',
                params: { lang },
            }),
        }),
    }),
})

export const { useCreateBookingMutation, useGetBookingRetryInfoQuery, useCreateCheckoutMutation } =
    bookingsApi
