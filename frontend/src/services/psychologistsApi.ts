import { createApi } from '@reduxjs/toolkit/query/react'

import type { Booking } from '../types/booking'
import type { GetPsychologistsParams, Psychologist, SymptomCode } from '../types/psychologist'
import type { SpecialistProfile } from '../types/specialist'
import { baseQueryWithReauth } from './baseQueryWithReauth'
import type { SessionBooking, SessionsResponse } from '../types/session'

export const psychologistsApi = createApi({
    reducerPath: 'psychologistsApi',

    baseQuery: baseQueryWithReauth,

    tagTypes: ['Sessions'],

    endpoints: (builder) => ({
        getPsychologists: builder.query<Psychologist[], GetPsychologistsParams | void>({
            query: (params) => {
                const searchParams = new URLSearchParams()

                searchParams.set('limit', String(params?.limit ?? 5))
                searchParams.set('offset', String(params?.offset ?? 0))
                searchParams.set('lang', params?.lang ?? 'uk')

                params?.symptomCodes?.forEach((code) => {
                    searchParams.append('symptom_codes', code)
                })

                if (params?.minPrice !== undefined) {
                    searchParams.set('price_from', String(params.minPrice))
                }

                if (params?.maxPrice !== undefined) {
                    searchParams.set('price_to', String(params.maxPrice))
                }

                if (params?.availableDay) {
                    searchParams.set('available_on', params.availableDay)
                }

                return {
                    url: `/psychologists?${searchParams.toString()}`,
                    method: 'GET',
                }
            },
        }),

        getSymptomCodes: builder.query<SymptomCode[], void>({
            query: () => ({
                url: '/symptom-codes',
                method: 'GET',
            }),
        }),

        getPsychologistById: builder.query<SpecialistProfile, { id: string; lang?: string }>({
            query: ({ id, lang = 'uk' }) => ({
                url: `/psychologists/${id}`,
                method: 'GET',
                params: { lang },
            }),
        }),

        getBookingById: builder.query<Booking, { id: string; lang: 'uk' | 'en' }>({
            query: ({ id, lang }) => ({
                url: `/bookings/${id}`,
                method: 'GET',
                params: { lang },
            }),
        }),

        getPsychologistMe: builder.query<SpecialistProfile, { lang?: string }>({
            query: ({ lang = 'uk' }) => ({
                url: `/psychologists/me/profile`,
                method: 'GET',
                params: { lang },
            }),
        }),

        getPsychologistSessions: builder.query<SessionBooking[], { lang?: string }>({
            query: ({ lang = 'uk' }) => ({
                url: '/psychologist/sessions',
                method: 'GET',
                params: { lang },
            }),
            transformResponse: (response: SessionsResponse) => response.items,
            providesTags: ['Sessions'],
        }),
    }),
})

export const {
    useGetPsychologistsQuery,
    useLazyGetPsychologistsQuery,
    useGetBookingByIdQuery,
    useGetSymptomCodesQuery,
    useGetPsychologistByIdQuery,
    useGetPsychologistMeQuery,
    useGetPsychologistSessionsQuery,
} = psychologistsApi
