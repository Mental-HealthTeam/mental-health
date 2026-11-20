import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { SpecialistProfile, SpecialistReview } from '../../../types/specialist'

export type ReviewCategory = 'anxiety' | 'stress' | 'relationships' | 'depression' | 'self-esteem'

type SpecialistProfileState = {
    profile: SpecialistProfile | null
}

const initialState: SpecialistProfileState = {
    profile: null,
}

const specialistProfileSlice = createSlice({
    name: 'specialistProfile',
    initialState,
    reducers: {
        setSpecialistProfile: (state, action: PayloadAction<SpecialistProfile>) => {
            state.profile = action.payload
        },
        updateSpecialistProfile: (state, action: PayloadAction<Partial<SpecialistProfile>>) => {
            if (!state.profile) return

            state.profile = { ...state.profile, ...action.payload }
        },
        addSpecialistReview: (state, action: PayloadAction<SpecialistReview>) => {
            if (!state.profile) return

            state.profile.reviews = [...(state.profile.reviews ?? []), action.payload]
        },
        clearSpecialistProfile: (state) => {
            state.profile = null
        },
    },
})

export const {
    setSpecialistProfile,
    updateSpecialistProfile,
    addSpecialistReview,
    clearSpecialistProfile,
} = specialistProfileSlice.actions

export const specialistProfileReducer = specialistProfileSlice.reducer
