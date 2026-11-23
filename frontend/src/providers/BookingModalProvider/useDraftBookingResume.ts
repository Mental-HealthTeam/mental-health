import { useEffect, useRef } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'

import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { consumeBookingResume } from '../../app/store/slices/bookingSlice'
import { useGetPsychologistByIdQuery } from '../../services/psychologistsApi'

import type { OpenBookingModalOptions } from './booking-modal-context'

export type BookingModalRequest = Omit<OpenBookingModalOptions, 'onContinue'> & {
    initialSelectedTime?: string
    aiSessionId?: string
}

type Props = {
    enabled: boolean
    language: 'uk' | 'en'
    onResume: (options: BookingModalRequest) => void
}

export const useDraftBookingResume = ({ enabled, language, onResume }: Props) => {
    const dispatch = useAppDispatch()
    const handledResume = useRef(false)

    const { draft, bookingId, resumeAfterLogin } = useAppSelector((state) => state.booking)

    const shouldLoad = enabled && Boolean(draft) && !bookingId

    const {
        currentData: specialist,
        isFetching,
        error,
    } = useGetPsychologistByIdQuery(
        shouldLoad && draft ? { id: draft.psychologist_id, lang: language } : skipToken,
        { refetchOnMountOrArgChange: true },
    )

    useEffect(() => {
        if (!resumeAfterLogin) {
            handledResume.current = false
            return
        }

        if (
            handledResume.current ||
            !shouldLoad ||
            isFetching ||
            error ||
            !specialist ||
            !draft ||
            specialist.psychologist_id !== draft.psychologist_id
        ) {
            return
        }

        handledResume.current = true

        onResume({
            specialist,
            slots: specialist.mock_slots ?? [],
            initialSelectedTime: draft.selected_time,
            aiSessionId: draft.ai_session_id,
        })

        dispatch(consumeBookingResume())
    }, [resumeAfterLogin, shouldLoad, isFetching, error, specialist, draft, onResume, dispatch])
}
