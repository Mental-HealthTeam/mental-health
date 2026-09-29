export type NavigationKey =
    'home' | 'about' | 'psychologists' | 'howItWorks' | 'reviews' | 'contact'

export type NavigationItem = {
    key: NavigationKey
    href: string
}

export const headerNavigationItems: NavigationItem[] = [
    {
        key: 'about',
        href: '#about',
    },
    {
        key: 'psychologists',
        href: '#psychologists',
    },
    {
        key: 'howItWorks',
        href: '#how-it-works',
    },
    {
        key: 'contact',
        href: '#contact',
    },
]

export const footerNavigationItems: NavigationItem[] = [
    {
        key: 'home',
        href: '#home',
    },
    {
        key: 'about',
        href: '#about',
    },
    {
        key: 'psychologists',
        href: '#psychologists',
    },
    {
        key: 'howItWorks',
        href: '#how-it-works',
    },
    {
        key: 'reviews',
        href: '#reviews',
    },
    {
        key: 'contact',
        href: '#contact',
    },
]
