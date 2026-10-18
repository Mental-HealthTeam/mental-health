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

export type TypeData = {
    content?: string
    match_data?: MatchData
    error?: string
}
