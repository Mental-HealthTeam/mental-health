export type SymptomCode =
    | 'anxiety'
    | 'burnout'
    | 'relationship'
    | 'stress'
    | 'grief'
    | 'self_esteem'
    | 'low_mood'
    | 'sleep'
    | 'family'
    | 'anger'
    | 'trauma'
    | 'addiction'
    | 'eating'
    | 'loneliness'
    | 'identity'
    | 'work_career'
    | 'motivation'

export type Psychologist = {
    psychologist_id: string
    full_name: string
    avatar_url: string | null
    experience_years: number
    price_per_hour: string
    methods: string[]
    specialization: SymptomCode[]
    mock_slots: {
        time: string
    }[]
}

export type GetPsychologistsParams = {
    limit?: number
    offset?: number
    symptomCodes?: SymptomCode[]
}
