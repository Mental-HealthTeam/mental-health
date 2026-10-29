import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import type { GetPsychologistsParams, Psychologist, SymptomCode } from '../types/psychologist'

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

                return {
                    url: `/psychologists?${searchParams.toString()}`,
                    method: 'GET',
                }
            },
        }),

        getSymptomCodes: builder.query<SymptomCode[], void>({
            query: () => ({
                url: '/symptoms',
                method: 'GET',
            }),
        }),
    }),
})

export const { useGetPsychologistsQuery, useLazyGetPsychologistsQuery, useGetSymptomCodesQuery } =
    psychologistsApi
