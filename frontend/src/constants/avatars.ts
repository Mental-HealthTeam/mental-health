import avatar1 from '../assets/avatars/hero-avatar-1.png'
import avatar2 from '../assets/avatars/hero-avatar-2.png'
import avatar3 from '../assets/avatars/hero-avatar-3.png'

type Avatar = {
    id: string
    src: string
}

export const avatars: Avatar[] = [
    {
        id: 'avatar1',
        src: avatar1,
    },
    {
        id: 'avatar2',
        src: avatar2,
    },
    {
        id: 'avatar3',
        src: avatar3,
    },
]
