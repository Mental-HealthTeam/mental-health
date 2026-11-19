import { createApi } from '@reduxjs/toolkit/query/react'

import { baseQueryWithReauth } from './baseQueryWithReauth'
import type { UserPublic } from '../types/auth'

type UpdateProfileBody = {
    name: string
}

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Me', 'SpecialistMe'],

    endpoints: (builder) => ({
        me: builder.query<UserPublic, void>({
            query: () => '/auth/me',
            providesTags: ['Me'],
        }),

        updateProfile: builder.mutation<UserPublic, UpdateProfileBody>({
            query: (body) => ({
                url: '/users/me',
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (_result, error) => (error ? [] : ['Me']),
        }),

        uploadAvatar: builder.mutation<UserPublic, File>({
            query: (file) => {
                const body = new FormData()

                body.append('file', file)

                return {
                    url: '/users/me/avatar',
                    method: 'POST',
                    body,
                }
            },
            invalidatesTags: (_result, error) => (error ? [] : ['Me']),
        }),

        deleteAvatar: builder.mutation<UserPublic, void>({
            query: () => ({
                url: '/users/me/avatar',
                method: 'DELETE',
            }),
            invalidatesTags: (_result, error) => (error ? [] : ['Me']),
        }),

        googleLogin: builder.mutation<UserPublic, { credential: string }>({
            query: (body) => ({
                url: '/auth/google',
                method: 'POST',
                body,
            }),
            invalidatesTags: (_result, error) => (error ? [] : ['Me']),
        }),

        logout: builder.mutation<void, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
        }),

        logoutAll: builder.mutation<void, void>({
            query: () => ({
                url: '/auth/logout-all',
                method: 'POST',
            }),
        }),
    }),
})

export const {
    useMeQuery,
    useUpdateProfileMutation,
    useUploadAvatarMutation,
    useDeleteAvatarMutation,
    useGoogleLoginMutation,
    useLogoutMutation,
    useLogoutAllMutation,
} = authApi
