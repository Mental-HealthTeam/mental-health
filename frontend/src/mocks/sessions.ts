import type { Session, SessionStatus } from '../types/session'
import avatar1 from '../assets/avatars/avatar-1.png'
import avatar2 from '../assets/avatars/avatar-2.png'
import avatar3 from '../assets/avatars/avatar-3.png'

// Дата відносно сьогодні: offset -1 = вчора, 0 = сьогодні, 1 = завтра...
const at = (offsetDays: number, hour: number): string => {
    const date = new Date()

    date.setDate(date.getDate() + offsetDays)
    date.setHours(hour, 0, 0, 0)

    return date.toISOString()
}

type Params = {
    id: string
    offsetDays: number
    hour: number
    status: SessionStatus
    client?: { name: string; avatar: string }
    topics?: string[]
}

const session = ({ id, offsetDays, hour, status, client, topics = [] }: Params): Session => ({
    id,
    date: at(offsetDays, hour),
    status,
    client_name: client?.name ?? null,
    client_avatar_url: client?.avatar ?? null,
    topics,
    meet_link: status === 'scheduled' ? `https://meet.google.com/mock-${id}` : null,
})

const OLENA = { name: 'Олена Колченовська', avatar: avatar1 }
const ANDRII = { name: 'Андрій Мельник', avatar: avatar2 }
const MARYNA = { name: 'Марина Іваненко', avatar: avatar3 }
const IRYNA = { name: 'Ірина Шевчук', avatar: avatar1 }
const DMYTRO = { name: 'Дмитро Коваль', avatar: avatar2 }

export const SESSIONS_MOCK: Session[] = [
    // позавчора: завершені
    session({
        id: 's-01',
        offsetDays: -2,
        hour: 18,
        status: 'completed',
        client: OLENA,
        topics: ['Тривожність', 'Депресія'],
    }),
    session({
        id: 's-02',
        offsetDays: -2,
        hour: 19,
        status: 'completed',
        client: ANDRII,
        topics: ['Вигорання'],
    }),

    // вчора: завершені
    session({
        id: 's-03',
        offsetDays: -1,
        hour: 19,
        status: 'completed',
        client: MARYNA,
        topics: ['Стосунки'],
    }),
    session({
        id: 's-04',
        offsetDays: -1,
        hour: 20,
        status: 'completed',
        client: IRYNA,
        topics: ['Депресія', 'Самооцінка'],
    }),

    // сьогодні
    session({
        id: 's-05',
        offsetDays: 0,
        hour: 19,
        status: 'scheduled',
        client: OLENA,
        topics: ['Тривожність', 'Депресія'],
    }),
    session({ id: 's-06', offsetDays: 0, hour: 20, status: 'free' }),

    // завтра
    session({
        id: 's-07',
        offsetDays: 1,
        hour: 12,
        status: 'scheduled',
        client: DMYTRO,
        topics: ['Самооцінка'],
    }),
    session({ id: 's-08', offsetDays: 1, hour: 18, status: 'free' }),
    session({
        id: 's-09',
        offsetDays: 1,
        hour: 19,
        status: 'scheduled',
        client: MARYNA,
        topics: ['Стосунки', 'Тривожність'],
    }),

    // післязавтра
    session({ id: 's-10', offsetDays: 2, hour: 11, status: 'free' }),
    session({
        id: 's-11',
        offsetDays: 2,
        hour: 17,
        status: 'scheduled',
        client: ANDRII,
        topics: ['Вигорання', 'Тривожність'],
    }),
    session({ id: 's-12', offsetDays: 2, hour: 18, status: 'free' }),

    // +3 дні
    session({
        id: 's-13',
        offsetDays: 3,
        hour: 15,
        status: 'scheduled',
        client: IRYNA,
        topics: ['Депресія'],
    }),
    session({ id: 's-14', offsetDays: 3, hour: 16, status: 'free' }),

    // +4 дні
    session({ id: 's-15', offsetDays: 4, hour: 12, status: 'free' }),
    session({ id: 's-16', offsetDays: 4, hour: 13, status: 'free' }),
    session({
        id: 's-17',
        offsetDays: 4,
        hour: 19,
        status: 'scheduled',
        client: OLENA,
        topics: ['Тривожність'],
    }),
]
