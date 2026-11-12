import { z } from 'zod'

export const clientProfileSchema = z.object({
    name: z.string().trim().min(1).max(255),
    email: z.string().trim().email(),
    telegram: z
        .string()
        .trim()
        .refine((value) => value === '' || /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(value)),
})
