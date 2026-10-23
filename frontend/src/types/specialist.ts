import type { SymptomCode } from './psychologist'

export type Language = 'uk' | 'en'

export type SpecialistBio = {
    about: string
    approach: string
    scope: string
}

export type SpecialistTopic = {
    id: string
    title: string
    description: string
}

export type Rating = 1 | 2 | 3 | 4 | 5

export type SpecialistReview = {
    id: string
    author: string
    avatar_url: string | null
    created_at: string

    topic_id: SymptomCode

    age?: number
    rating: Rating
    verified: boolean
    text: string
}

export type SpecialistProfile = {
    id: string

    // особисті дані
    name: string
    title: string
    avatar_url: string

    // статус і умови консультацій
    is_verified: boolean
    experience_years: number
    session_minutes: number
    price_uah: number

    // методи
    tags_symptoms: string[]
    methods: string[]
    languages: Language[]

    // сертифікати та опис
    certificates: string[]
    topics: SpecialistTopic[]
    bio: SpecialistBio

    // відгуки
    reviews: SpecialistReview[]

    // запис і оплата
    mock_slots: string[]
    meet_link: string

    // дані про оплату
    iban: string
    tax_id: string
    account_name: string
}
