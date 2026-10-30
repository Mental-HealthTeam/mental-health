export type SessionStatus = 'scheduled' | 'completed' | 'available'

export type Session = {
    id: string
    date: string
    status: SessionStatus
    client_name: string | null
    client_avatar_url: string | null
    topics: string[]
    meet_link: string | null
}