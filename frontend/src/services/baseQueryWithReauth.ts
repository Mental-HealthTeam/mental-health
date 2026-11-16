import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
    BaseQueryApi,
    BaseQueryFn,
    FetchArgs,
    FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { sessionExpired } from '../app/store/slices/authSlice'

const baseQuery = fetchBaseQuery({
    baseUrl: '/api',
    credentials: 'include',
})

let refreshPromise: Promise<boolean> | null = null

const refreshSession = async (api: BaseQueryApi, extraOptions: object): Promise<boolean> => {
    try {
        const response = await baseQuery({ url: '/auth/refresh', method: 'POST' }, api, extraOptions)

        return !response.error
    } finally {
        refreshPromise = null
    }
}

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
    async (args, api, extraOptions) => {

      const result = await baseQuery(args, api, extraOptions)

        if (result.error?.status !== 401) {
            return result
        }

        const url = typeof args === 'string' ? args : args.url
        if (url === '/auth/google' || url === '/auth/refresh') {
            return result
        }

        if (!refreshPromise) {
            refreshPromise = refreshSession(api, extraOptions)
        }

        const isRefreshed = await refreshPromise

        if (!isRefreshed) {
            api.dispatch(sessionExpired())
            return result
        }

        return baseQuery(args, api, extraOptions)
    }