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
