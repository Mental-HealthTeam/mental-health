const LOCALES: Record<string, string> = { uk: 'uk-UA', en: 'en-GB' }

const getLocale = (language: string): string => LOCALES[language] ?? 'uk-UA'

export const formatDate = (iso: string, language: string): string =>
    new Intl.DateTimeFormat(getLocale(language), {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(iso))

export const formatTime = (iso: string, language: string): string =>
    new Intl.DateTimeFormat(getLocale(language), {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(new Date(iso))

export const formatChatDate = (timestamp: number, locale: string): string => {
    const date = new Date(timestamp)

    const day = date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

    const time = date.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
    })

    return `${day}, ${time}`
}