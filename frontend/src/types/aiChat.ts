export type MatchData = {
    symptom_codes: string[]
    language: string[]
    preferred_gender: string | null
    min_price_per_hour: number | null
    max_price_per_hour: number | null
    min_experience_years: number | null
    max_experience_years: number | null
    min_range_suitable_time: string | null
    max_range_suitable_time: string | null
    ready_for_search: boolean
}

export type Psychologist = {
    psychologist_id: string | number
    full_name: string
    title: string
    avatar_url: string | null
    price_per_hour: number
    languages: string[]
    mock_slots: { time_label: string; time: string }[]
    matched_symptom_codes: string[]
}

export type TypeData = {
    content?: string
    match_data?: MatchData
    error?: string
}
