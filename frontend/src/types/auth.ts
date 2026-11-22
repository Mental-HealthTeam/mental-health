import type { SymptomCode } from './psychologist'

export type Role = 'client' | 'psychologist' | 'admin'

export type UserPublic = {
    id: string
    email: string
    name: string | null
    avatar_url: string | null
    role: Role
}

export type UserProfile = UserPublic & {
    meet_link: string | null
    telegram: string | null
    topics: SymptomCode[] | null
}
