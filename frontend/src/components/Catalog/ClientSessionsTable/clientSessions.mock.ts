export type ClientSession = {
    id: string
    specialistName: {
        uk: string
        en: string
    }
    avatarUrl: string | null
    date: string
    time: string
    status: 'scheduled' | 'completed'
    canJoin: boolean
    isSaved: boolean
}

const specialistNames: ClientSession['specialistName'][] = [
    { uk: 'Катерина Кіщук', en: 'Kateryna Kishchuk' },
    { uk: 'Катерина Ковальська', en: 'Kateryna Kovalska' },
    { uk: 'Олена Мельник', en: 'Olena Melnyk' },
    { uk: 'Андрій Шевченко', en: 'Andrii Shevchenko' },
    { uk: 'Марія Бондар', en: 'Mariia Bondar' },
    { uk: 'Олександр Ткаченко', en: 'Oleksandr Tkachenko' },
]

const sessionTimes = ['10:00', '12:00', '14:00', '16:00', '18:00', '19:00']

export const clientSessionsMock: ClientSession[] = Array.from({ length: 36 }, (_, index) => {
    const isCompleted = index >= 18
    const day = String((index % 18) + 1).padStart(2, '0')
    const month = isCompleted ? '10' : '12'

    return {
        id: `session-${index + 1}`,
        specialistName: specialistNames[index % specialistNames.length],
        avatarUrl: null,
        date: `${day}.${month}.2026`,
        time: sessionTimes[index % sessionTimes.length],
        status: isCompleted ? 'completed' : 'scheduled',
        canJoin: index === 0,
        isSaved: index % 3 === 0,
    }
})
