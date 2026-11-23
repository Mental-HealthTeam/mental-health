import { z } from 'zod'

const isTelegramContact = (value: string): boolean => {
    if (value === '') return true

    return /^@?[a-zA-Z0-9_]{5,32}$/.test(value)
}

export const clientProfileSchema = z.object({
    name: z.string().trim().min(1).max(255),
    email: z.string().trim().email(),
    telegram: z.string().trim().refine(isTelegramContact),
})
