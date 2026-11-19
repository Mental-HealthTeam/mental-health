import { authApi } from './authApi'
import type { SpecialistMe } from '../types/specialist'
import type { SpecialistProfilePayload } from '../components/SpecialistProfileForm/specialistProfile.schema'

export const specialistProfileApi = authApi.injectEndpoints({
    endpoints: (builder) => ({
        getSpecialistMe: builder.query<SpecialistMe, void>({
            query: () => '/psychologists/me/profile',
            providesTags: ['SpecialistMe'],
        }),
        updateSpecialistProfile: builder.mutation<SpecialistMe, SpecialistProfilePayload>({
            query: (body) => ({
                url: '/psychologists/me/profile',
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (_result, error) => (error ? [] : ['SpecialistMe']),
        }),
    }),
})

export const { useGetSpecialistMeQuery, useUpdateSpecialistProfileMutation } =
    specialistProfileApi