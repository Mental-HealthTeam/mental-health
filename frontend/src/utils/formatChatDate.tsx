const dateFormatter = new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
})

export const formatChatDate = (timestamp: number): string => {
    const date = dateFormatter.format(timestamp).replace(' р.', '')
    const time = timeFormatter.format(timestamp)

    return `${date}, ${time}`
}
