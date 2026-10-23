import type { SpecialistReview } from '../types/specialist'

import avatar1 from '../assets/avatars/avatar-1.png'
import avatar2 from '../assets/avatars/avatar-2.png'
import avatar3 from '../assets/avatars/avatar-3.png'

export const REVIEWS_MOCK: SpecialistReview[] = [
    {
        id: 'review-1',
        author: 'Олена Колченовська',
        avatar_url: avatar1,
        created_at: '2026-09-27',
        topic_id: 'anxiety',
        rating: 5,
        verified: true,
        text: 'Проходила важкий період після розлучення. Дуже бережний підхід фахівця зумів повернути мені відчуття ґрунту під ногами.',
    },
    {
        id: 'review-2',
        author: 'Олена',
        avatar_url: avatar2,
        created_at: '2026-09-27',
        topic_id: 'anxiety',
        age: 29,
        rating: 3,
        verified: true,
        text: 'Вже після 2-х сесій відчула значне полегшення. Психолог допомогла розібратися з причинами втоми та навчила простим технікам самодопомоги.',
    },
    {
        id: 'review-3',
        author: 'Андрій',
        avatar_url: avatar3,
        created_at: '2026-09-15',
        topic_id: 'stress',
        age: 34,
        rating: 5,
        verified: true,
        text: 'Навчився помічати ранні ознаки стресу і не доводити себе до зриву. Дуже практичні поради після кожної сесії.',
    },
    {
        id: 'review-4',
        author: 'Марина',
        avatar_url: avatar1,
        created_at: '2026-08-30',
        topic_id: 'relationship',
        age: 31,
        rating: 4,
        verified: true,
        text: 'Нарешті навчилася говорити про свої кордони без почуття провини. Стосунки з партнером стали значно спокійнішими.',
    },
    {
        id: 'review-5',
        author: 'Ірина',
        avatar_url: avatar2,
        created_at: '2026-08-12',
        topic_id: 'low_mood',
        age: 42,
        rating: 4,
        verified: true,
        text: 'Поступово повернулися інтерес до життя і сили. Дякую за терпіння та підтримку на кожному етапі.',
    },
    {
        id: 'review-6',
        author: 'Дмитро',
        avatar_url: avatar3,
        created_at: '2026-07-21',
        topic_id: 'self_esteem',
        age: 27,
        rating: 5,
        verified: true,
        text: 'Працювали із синдромом самозванця. Тепер значно впевненіше почуваюся на роботі й не знецінюю власні досягнення.',
    },
]
