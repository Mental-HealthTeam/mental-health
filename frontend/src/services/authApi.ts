import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './baseQueryWithReauth'
import type { UserPublic } from '../types/auth'

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Me'],
    endpoints: (builder) => ({
        me: builder.query<UserPublic, void>({
            query: () => '/auth/me',
            providesTags: ['Me'],
        }),
        googleLogin: builder.mutation<UserPublic, { credential: string }>({
            query: (body) => ({ url: '/auth/google', method: 'POST', body }),
            invalidatesTags: ['Me'],
        }),
        logout: builder.mutation<void, void>({
            query: () => ({ url: '/auth/logout', method: 'POST' }),
        }),
        logoutAll: builder.mutation<void, void>({
            query: () => ({ url: '/auth/logout-all', method: 'POST' }),
        }),
    }),
})

export const {
    useMeQuery,
    useGoogleLoginMutation,
    useLogoutMutation,
    useLogoutAllMutation,
} = authApi