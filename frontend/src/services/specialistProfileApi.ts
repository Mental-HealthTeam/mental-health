import { authApi } from './authApi'
import type { SpecialistMe, SpecialistProfile, UpdateProfileBody } from '../types/specialist'

export const specialistProfileApi = authApi.injectEndpoints({
    endpoints: (builder) => ({
        getSpecialistMe: builder.query<SpecialistProfile, { lang?: string }>({
            query: ({ lang = 'uk' }) => ({
                url: `/psychologists/me/profile`,
                method: 'GET',
                params: { lang },
            }),
            providesTags: ['SpecialistMe'],
        }),
        updateSpecialistProfile: builder.mutation<SpecialistMe, UpdateProfileBody>({
            query: (body) => ({
                url: '/psychologists/me/profile',
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (_result, error) => (error ? [] : ['SpecialistMe']),
        }),
    }),
})

export const { useGetSpecialistMeQuery, useUpdateSpecialistProfileMutation } = specialistProfileApi
