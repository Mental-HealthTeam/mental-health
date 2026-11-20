import { z } from 'zod'
import type { SymptomCode } from '../../types/psychologist'

const required = 'validation.required'

export const specialistProfileSchema = z.object({
    name: z.string().trim().min(1, required).max(100),

    experience_years: z
        .string()
        .trim()
        .min(1, required)
        .pipe(z.coerce.number<string>().int().min(0).max(80)),

    price_per_hour: z
        .string()
        .trim()
        .min(1, required)
        .pipe(z.coerce.number<string>().min(0).max(1_000_000)),

    approach: z.string().trim().min(1, required).max(100),

    about: z.string().trim().min(1, required).max(500),

    certificates: z
        .array(z.string().trim().max(255))
        .transform((list) => list.filter((title) => title !== ''))
        .pipe(z.array(z.string()).min(1, required)),

    topics: z.array(z.custom<SymptomCode>((value) => typeof value === 'string')).min(1, required),
})

export type SpecialistProfileInput = z.input<typeof specialistProfileSchema>

export type SpecialistProfilePayload = z.output<typeof specialistProfileSchema>

export type SpecialistProfileField = keyof SpecialistProfileInput

export type SpecialistProfileErrors = Partial<Record<SpecialistProfileField | 'submit', string>>

export const getInvalidFields = (error: z.ZodError): SpecialistProfileField[] => {
    const fields = new Set<SpecialistProfileField>()

    for (const issue of error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string') {
            fields.add(field as SpecialistProfileField)
        }
    }

    return [...fields]
}
