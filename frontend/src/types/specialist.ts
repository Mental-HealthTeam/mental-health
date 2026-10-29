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
    full_name: string
    title: string
    avatar_url: string | null
    is_verified: boolean
    experience_years: number
    session_minutes: number
    price_per_hour: string // "1200.00"
    topics: SymptomCode[]
    methods: string[]
    languages: Language[]
    certificates: { title: string }[]
    bio: SpecialistBio
    reviews: SpecialistReview[]
    mock_slots: Slot[]
}

// PATCH /api/psychologists/me/profile
export type SpecialistProfilePatch = {
    title?: string
    bio?: SpecialistBio
    topics?: SymptomCode[]
    methods?: string[]
    certificates?: string[]
    languages?: Language[]
    experience_years?: number
    price_per_hour?: number
}

// GET/PUT /api/psychologists/me/payout-details
export type PayoutDetails = {
    iban: string
    tax_id: string
    account_name: string
}