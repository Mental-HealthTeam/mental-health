import type {
    AvailableSlot,
    SessionBooking,
    SessionClient,
    SessionItem,
    SessionPsychologist,
} from '../types/session'
import avatar1 from '../assets/avatars/avatar-1.png'
import avatar2 from '../assets/avatars/avatar-2.png'
import avatar3 from '../assets/avatars/avatar-3.png'

// Дата відносно сьогодні: -1 = вчора, 0 = сьогодні, 1 = завтра...
const at = (offsetDays: number, hour: number): string => {
    const date = new Date()

    date.setDate(date.getDate() + offsetDays)
    date.setHours(hour, 0, 0, 0)

    return date.toISOString()
}

const uuid = (prefix: string, n: number): string =>
    `${prefix}-0000-4000-8000-${String(n).padStart(12, '0')}`

const PSYCHOLOGIST: SessionPsychologist = {
    psychologist_id: uuid('aaaaaaaa', 1),
    full_name: 'Оксана Петренко',
    title: 'Клінічний психолог',
    avatar_url: avatar1,
}

const OLENA: SessionClient = {
    id: uuid('c0000001', 1),
    name: 'Олена Колченовська Аліксоновська',
    avatar_url: avatar1,
}
const ANDRII: SessionClient = { id: uuid('c0000001', 2), name: 'Андрій Мельник', avatar_url: avatar2 }
const MARYNA: SessionClient = { id: uuid('c0000001', 3), name: 'Марина Іваненко', avatar_url: avatar3 }
const IRYNA: SessionClient = { id: uuid('c0000001', 4), name: 'Ірина Шевчук', avatar_url: avatar1 }
const DMYTRO: SessionClient = { id: uuid('c0000001', 5), name: 'Дмитро Коваль', avatar_url: avatar2 }

type BookingParams = {
    n: number
    offsetDays: number
    hour: number
    status: SessionBooking['status']
    client: SessionClient
}

const booking = ({ n, offsetDays, hour, status, client }: BookingParams): SessionBooking => ({
    booking_id: uuid('b0000001', n),
    selected_time: at(offsetDays, hour),
    status,
    payment_status: status === 'completed' ? 'paid' : 'held',
    price: '1900.00',
    currency: 'UAH',
    meet_link: status === 'confirmed' ? `https://meet.google.com/mock-${n}` : null,
    psychologist: PSYCHOLOGIST,
    client,
})

let slotCounter = 0

const slot = (offsetDays: number, hour: number): AvailableSlot => {
    slotCounter += 1

    return {
        slot_id: uuid('d0000001', slotCounter),
        selected_time: at(offsetDays, hour),
    }
}

export const SESSIONS_MOCK: SessionItem[] = [
    // Минулі дні: завершені
    booking({ n: 1, offsetDays: -2, hour: 18, status: 'completed', client: OLENA }),
    booking({ n: 2, offsetDays: -2, hour: 19, status: 'completed', client: ANDRII }),
    booking({ n: 3, offsetDays: -1, hour: 19, status: 'completed', client: MARYNA }),
    booking({ n: 4, offsetDays: -1, hour: 20, status: 'completed', client: IRYNA }),

    // Сьогодні: заплановані + вільний слот пізніше
    booking({ n: 5, offsetDays: 0, hour: 19, status: 'confirmed', client: OLENA }),
    slot(0, 21),

    // Завтра: заплановані + вільні слоти між ними
    slot(1, 10),
    booking({ n: 7, offsetDays: 1, hour: 12, status: 'confirmed', client: DMYTRO }),
    slot(1, 15),
    booking({ n: 9, offsetDays: 1, hour: 19, status: 'confirmed', client: MARYNA }),

    // Післязавтра: запланована + слоти
    slot(2, 11),
    booking({ n: 11, offsetDays: 2, hour: 17, status: 'confirmed', client: ANDRII }),
    slot(2, 18),

    // Через 3 дні: лише вільні слоти
    slot(3, 12),
    slot(3, 15),
    slot(3, 17),

    // Через 4 дні
    slot(4, 10),
    slot(4, 19),
]