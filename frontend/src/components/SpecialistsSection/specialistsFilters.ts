export const SPECIALISTS_FILTER_CODES = [
    'burnout',
    'anxiety',
    'low_mood',
    'stress',
    'self_esteem',
    'relationship',
] as const

export type SpecialistsFilterCode = (typeof SPECIALISTS_FILTER_CODES)[number]
