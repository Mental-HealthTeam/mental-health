export type ClientLinkKey = 'consultation' | 'faq' | 'blog' | 'loyalty'

export type SpecialistLinkKey = 'becomeSpecialist' | 'requirements' | 'account'

export type LegalLinkKey = 'privacy' | 'publicOffer' | 'userAgreement' | 'cookiePolicy'

export type FooterLink<T extends string> = {
    key: T
    href: string
}

export const clientLinks: FooterLink<ClientLinkKey>[] = [
    {
        key: 'consultation',
        href: '#consultation',
    },
    {
        key: 'faq',
        href: '#faq',
    },
    {
        key: 'blog',
        href: '#blog',
    },
    {
        key: 'loyalty',
        href: '#loyalty',
    },
]

export const specialistLinks: FooterLink<SpecialistLinkKey>[] = [
    {
        key: 'becomeSpecialist',
        href: '#become-specialist',
    },
    {
        key: 'requirements',
        href: '#specialist-requirements',
    },
    {
        key: 'account',
        href: '#specialist-account',
    },
]

export const legalLinks: FooterLink<LegalLinkKey>[] = [
    {
        key: 'privacy',
        href: '#privacy',
    },
    {
        key: 'publicOffer',
        href: '#public-offer',
    },
    {
        key: 'userAgreement',
        href: '#user-agreement',
    },
    {
        key: 'cookiePolicy',
        href: '#cookie-policy',
    },
]
