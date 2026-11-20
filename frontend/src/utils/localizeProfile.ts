import type { SpecialistProfile } from '../types/specialist'

type RawProfile = Omit<SpecialistProfile, 'bio' | 'methods' | 'certificates' | 'title'> & {
    title: string
    title_eng?: string | null
    bio: SpecialistProfile['bio']
    bio_eng?: SpecialistProfile['bio'] | null
    methods: string[]
    methods_eng?: string[] | null
    certificates: string[]
    certificates_eng?: string[] | null
}

export const localizeProfile = (raw: RawProfile, lang: string) => {
    const isEn = lang.startsWith('en')

    return {
        ...raw,
        title: (isEn && raw.title_eng) || raw.title,
        bio: (isEn && raw.bio_eng) || raw.bio,
        methods: (isEn && raw.methods_eng?.length ? raw.methods_eng : raw.methods) ?? [],
        certificates:
            (isEn && raw.certificates_eng?.length ? raw.certificates_eng : raw.certificates) ?? [],
    }
}