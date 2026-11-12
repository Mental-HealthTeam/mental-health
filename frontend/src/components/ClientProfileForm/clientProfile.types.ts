import type { SymptomCode } from '../../types/psychologist'

export type ClientProfileValues = {
    name: string
    email: string
    telegram: string
    topics: SymptomCode[]
    notifications: boolean
}

export type ClientProfileSubmit = ClientProfileValues & {
    avatarFile: File | null
    removeAvatar: boolean
}

export type ClientTextField = 'name' | 'email' | 'telegram'

export type ClientProfileErrors = Partial<Record<ClientTextField | 'submit', string>>
