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

type BookingsResponse = {
    items: Booking[]
    total: number
    limit: number
    offset: number
}

export const bookingsApi = createApi({
    reducerPath: 'bookingsApi',

    baseQuery: baseQueryWithReauth,

    tagTypes: ['PendingBookings'],

    endpoints: (builder) => ({
        createBooking: builder.mutation<Booking, CreateBookingRequest>({
            query: (body) => ({
                url: '/bookings',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['PendingBookings'],
        }),

        createCheckout: builder.mutation<CreateCheckoutResponse, CreateCheckoutRequest>({
            query: (body) => ({
                url: '/payments/checkout',
                method: 'POST',
                body,
            }),
        }),

        getPendingBookings: builder.query<BookingsResponse, void>({
            query: () => ({
                url: '/bookings',
                method: 'GET',
                params: {
                    status: 'pending',
                    limit: 100,
                    offset: 0,
                },
            }),
            providesTags: ['PendingBookings'],
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

export const {
    useCreateBookingMutation,
    useCreateCheckoutMutation,
    useGetPendingBookingsQuery,
    useGetBookingRetryInfoQuery,
} = bookingsApi
