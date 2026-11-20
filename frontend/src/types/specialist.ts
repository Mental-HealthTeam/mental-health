import type { SymptomCode } from './psychologist'

export type Language = 'uk' | 'en'
export type Rating = 1 | 2 | 3 | 4 | 5

export type SpecialistBio = {
    about: string
    approach: string
    scope: string
}

export type Slot = {
    time: string
}

export type SpecialistReview = {
    id: string
    author: string
    avatar_url: string | null
    created_at: string
    topic_id: SymptomCode
    age: number | null
    rating: Rating
    verified: boolean
    text: string
}

// GET /api/psychologists/{id} і GET /api/psychologists/me/profile
export type SpecialistProfile = {
    psychologist_id: string

    full_name?: string
    avatar_url?: string | null
    is_verified?: boolean

    title: string
    title_eng?: string | null

    bio: SpecialistBio
    bio_eng?: SpecialistBio | null

    methods: string[]
    methods_eng?: string[] | null

    certificates: string[]
    certificates_eng?: string[] | null

    topics: SymptomCode[]
    languages: string[]

    experience_years: number
    price_per_hour: string
    session_minutes?: number

    reviews?: SpecialistReview[]
    mock_slots: Slot[]
}

// GET/PUT /api/psychologists/me/payout-details
export type PayoutDetails = {
  iban: string
  tax_id: string
  account_name: string
}

// PATCH /api/psychologists/me/profile
export type UpdateProfileBody = {
    title?: string
    bio?: SpecialistBio
    topics?: SymptomCode[]
    methods?: string[]
    certificates?: { title: string }[]
    languages?: Language[]
    experience_years?: number
    price_per_hour?: number
}

export type ProfileFormState = {
  name: string
  experience_years: string
  price_per_hour: string
  approach: string
  about: string
  certificates: { title: string }[]
  topics: SymptomCode[]
}

export type OnFieldChange = <K extends keyof ProfileFormState>(
    field: K,
    value: ProfileFormState[K],
) => void

export type SpecialistMe = {
    id: number | string
    name: string | null
    avatar_url: string | null
    experience_years: number | null
    price_per_hour: number | null
    approach: string | null
    about: string | null
    certificates: { title: string }[]
    topics: SymptomCode[]
}