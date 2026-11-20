import type { SymptomCode } from '../../types/psychologist'
import type { SpecialistProfilePayload } from './specialistProfile.schema'

export type SpecialistProfileValues = {
    name: string
    experience_years: string
    price_per_hour: string
    approach: string
    about: string
    certificates: string[]
    topics: SymptomCode[]
}

export type SpecialistProfileSubmit = SpecialistProfilePayload & {
    avatarFile: File | null
    removeAvatar: boolean
}

export type SpecialistTextField =
    | 'name'
    | 'experience_years'
    | 'price_per_hour'
    | 'approach'
    | 'about'

export type SpecialistProfileErrors = Partial<
    Record<keyof SpecialistProfileValues | 'submit', string>
>