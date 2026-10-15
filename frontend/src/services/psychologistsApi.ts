import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

type Psychologist = {
    psychologist_id: string
    full_name: string
    avatar_url: string | null
    experience_years: number
    price_per_hour: string
    methods: string[]
    specialization: string[]
    mock_slots: {
        time_label: string
        time: string
    }[]
}

type GetPsychologistsParams = {
    limit?: number
    offset?: number
    symptomCodes?: string[]
}

export const psychologistsApi = createApi({
    reducerPath: 'psychologistsApi',

    baseQuery: fetchBaseQuery({
        baseUrl: '/api',
    }),

    endpoints: (builder) => ({
        getPsychologists: builder.query<Psychologist[], GetPsychologistsParams>({
            query: ({ limit = 5, offset = 0, symptomCodes = [] }) => {
                const params = new URLSearchParams()

                params.set('limit', String(limit))
                params.set('offset', String(offset))

                symptomCodes.forEach((code) => {
                    params.append('symptom_codes', code)
                })

                return {
                    url: `/psychologists?${params.toString()}`,
                }
            },
        }),

        getPsychologistById: builder.query<Psychologist, string>({
            query: (psychologistId) => `/psychologists/${psychologistId}`,
        }),
    }),
})

export const { useGetPsychologistsQuery, useGetPsychologistByIdQuery } = psychologistsApi
