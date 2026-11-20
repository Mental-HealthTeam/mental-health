import { authApi } from './authApi'
import type { UserProfile } from '../types/auth'
import type { SessionsResponse } from '../types/session'

export const clientCabinetApi = authApi.injectEndpoints({
    endpoints: (builder) => ({
        clientProfile: builder.query<UserProfile, void>({
            query: () => '/users/me',
            providesTags: ['Me'],
        }),
        clientSessions: builder.query<SessionsResponse, void>({
            query: () => '/user/sessions',
        }),
    }),
})

export const { useClientProfileQuery, useClientSessionsQuery } = clientCabinetApi
