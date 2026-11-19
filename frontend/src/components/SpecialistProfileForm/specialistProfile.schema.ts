import { z } from 'zod'
import type { SymptomCode } from '../../types/psychologist'

export const specialistProfileSchema = z.object({
    name: z.string().trim().min(1).max(255),

    experience_years: z
        .string()
        .trim()
        .min(1)
        .pipe(z.coerce.number<string>().int().min(0).max(80)),

    price_per_hour: z
        .string()
        .trim()
        .min(1)
        .pipe(z.coerce.number<string>().min(0).max(1_000_000)),

    approach: z.string().trim().max(1000),

    about: z.string().trim().max(2000),

    certificates: z
        .array(z.object({ title: z.string().trim().max(255) }))
        .transform((list) => list.filter((item) => item.title !== '')),

    topics: z.array(z.custom<SymptomCode>((value) => typeof value === 'string')),
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