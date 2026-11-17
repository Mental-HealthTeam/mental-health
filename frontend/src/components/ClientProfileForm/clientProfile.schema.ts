import { z } from 'zod'

const isTelegramContact = (value: string): boolean => {
    if (value === '') return true

    if (/^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(value)) {
        return true
    }

    if (!/^\+[\d ()-]+$/.test(value)) {
        return false
    }

    const phone = value.replace(/[ ()-]/g, '')

    return /^\+[1-9]\d{7,14}$/.test(phone)
}

export const clientProfileSchema = z.object({
    name: z.string().trim().min(1).max(255),
    email: z.string().trim().email(),
    telegram: z.string().trim().refine(isTelegramContact),
})
