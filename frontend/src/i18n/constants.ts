export const LANGUAGES = {
    UK: 'uk',
    EN: 'en',
} as const

export type Language = (typeof LANGUAGES)[keyof typeof LANGUAGES]

export const DEFAULT_LANGUAGE: Language = LANGUAGES.UK

export const NAMESPACES = [
    'common',
    'navigation',
    'actions',
    'accessibility',
    'home',
    'psychologists',
    'auth',
    'whyChooseUs',
] as const

export type Namespace = (typeof NAMESPACES)[number]

export const DEFAULT_NAMESPACE: Namespace = 'common'
