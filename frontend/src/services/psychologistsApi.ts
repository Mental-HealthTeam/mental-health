import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import type { GetPsychologistsParams, Psychologist, SymptomCode } from '../types/psychologist'
import type { SpecialistProfile } from '../types/specialist'
import type { Booking } from '../types/booking'

export const psychologistsApi = createApi({
    reducerPath: 'psychologistsApi',

    baseQuery: fetchBaseQuery({
        baseUrl: '/api',
    }),

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
                    searchParams.set('min_price_per_hour', String(params.minPrice))
                }

                if (params?.maxPrice !== undefined) {
                    searchParams.set('max_price_per_hour', String(params.maxPrice))
                }

                if (params?.availableDay) {
                    searchParams.set('available_day', params.availableDay)
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
    }),
})

export const {
    useGetPsychologistsQuery,
    useLazyGetPsychologistsQuery,
    useGetBookingByIdQuery,
    useGetSymptomCodesQuery,
    useGetPsychologistByIdQuery,
} = psychologistsApi
