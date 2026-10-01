import { DEFAULT_LANGUAGE, LANGUAGES, type Language } from './constants'

const LANGUAGE_COOKIE = 'language'

const isLanguage = (value: string): value is Language => {
    return Object.values(LANGUAGES).includes(value as Language)
}

export const getStoredLanguage = (): Language => {
    const value = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${LANGUAGE_COOKIE}=`))
        ?.split('=')[1]

    return value && isLanguage(value) ? value : DEFAULT_LANGUAGE
}

export const saveLanguage = (language: Language) => {
    document.cookie = `${LANGUAGE_COOKIE}=${language}; path=/; max-age=31536000; SameSite=Lax`
}
