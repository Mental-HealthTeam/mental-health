import { authApi } from './authApi'
import type { UserProfile } from '../types/auth'
import type { SessionsResponse } from '../types/session'

const sessionUrls = {
    all: '/user/sessions',
    scheduled: '/user/sessions/scheduled',
    completed: '/user/sessions/completed',
    saved: '/user/sessions/saved',
} as const

export type ClientSessionsFilter = keyof typeof sessionUrls

type SetSessionSavedRequest = {
    bookingId: string
    saved: boolean
}

type SetSessionSavedResponse = {
    booking_id: string
    saved: boolean
}

export const clientCabinetApi = authApi
    .enhanceEndpoints({ addTagTypes: ['ClientSessions'] })
    .injectEndpoints({
        endpoints: (builder) => ({
            clientProfile: builder.query<UserProfile, void>({
                query: () => '/users/me',
                providesTags: ['Me'],
            }),
            clientSessions: builder.query<SessionsResponse, ClientSessionsFilter | void>({
                query: (filter) => sessionUrls[filter ?? 'all'],
                providesTags: ['ClientSessions'],
            }),
            setSessionSaved: builder.mutation<SetSessionSavedResponse, SetSessionSavedRequest>({
                query: ({ bookingId, saved }) => ({
                    url: `/user/sessions/${bookingId}/save`,
                    method: saved ? 'POST' : 'DELETE',
                }),
                invalidatesTags: (result) => (result ? ['ClientSessions'] : []),
            }),
        }),
    })

export const { useClientProfileQuery, useClientSessionsQuery, useSetSessionSavedMutation } =
    clientCabinetApi
