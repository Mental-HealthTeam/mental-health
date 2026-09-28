export type NavigationItem = {
    key: 'about' | 'psychologists' | 'howItWorks' | 'contact'
    href: string
}

export const navigationItems: NavigationItem[] = [
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
