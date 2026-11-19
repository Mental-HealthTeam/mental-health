import { useCallback, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { clearBookingDraft } from '../../app/store/slices/bookingSlice'
import { useMeQuery } from '../../services/authApi'

type Props = {
    onUserChange: () => void
}

export const usePendingBookingResume = ({ onUserChange }: Props) => {
    const location = useLocation()
    const dispatch = useAppDispatch()
    const { i18n } = useTranslation()

    const previousUserId = useRef<string | null | undefined>(undefined)

    const { resumeAfterLogin, returnPath } = useAppSelector((state) => state.booking)

    const {
        currentData: user,
        isFetching: isCheckingUser,
        isSuccess: isUserLoaded,
        error: userError,
    } = useMeQuery()

    const currentPath = location.pathname + location.search + location.hash

    const isReturnPage =
        resumeAfterLogin && returnPath === currentPath && location.pathname !== '/sign-in'

    const language: 'uk' | 'en' = (i18n.resolvedLanguage ?? i18n.language).startsWith('en')
        ? 'en'
        : 'uk'

    const handleUserChange = useCallback(() => {
        dispatch(clearBookingDraft())
        onUserChange()
    }, [dispatch, onUserChange])

    useEffect(() => {
        if (isCheckingUser) {
            return
        }

        const isUnauthorized = userError && 'status' in userError && userError.status === 401

        if (!isUserLoaded && !isUnauthorized) {
            return
        }

        const currentUserId = user?.id ?? null
        const previousId = previousUserId.current

        previousUserId.current = currentUserId

        if (previousId === undefined || previousId === null || previousId === currentUserId) {
            return
        }

        handleUserChange()
    }, [user, userError, isUserLoaded, isCheckingUser, handleUserChange])

    return {
        user,
        isCheckingUser,
        isReturnPage,
        language,
    }
}
