export type Role = 'client' | 'psychologist' | 'admin'

export type UserPublic = {
    id: string
    email: string
    name: string
    avatar_url: string | null
    role: Role
}