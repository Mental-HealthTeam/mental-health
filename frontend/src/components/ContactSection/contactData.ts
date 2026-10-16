import { ClockIcon, EmailIcon, InfoIcon, TelegramIcon } from '../UI/Icons'

export const CONTACT_GROUPS = [
    {
        titleKey: 'direct.title',
        items: [
            {
                id: 'telegram',
                labelKey: 'direct.telegram.label',
                valueKey: 'direct.telegram.value',
                icon: TelegramIcon,
                href: 'https://t.me/support_bot',
                external: true,
            },
            {
                id: 'email',
                labelKey: 'direct.email.label',
                valueKey: 'direct.email.value',
                icon: EmailIcon,
                href: 'mailto:support@platform.com',
                external: false,
            },
        ],
    },
    {
        titleKey: 'work.title',
        items: [
            {
                id: 'hours',
                labelKey: 'work.hours.label',
                valueKey: 'work.hours.value',
                icon: ClockIcon,
            },
            {
                id: 'response',
                labelKey: 'work.response.label',
                valueKey: 'work.response.value',
                icon: InfoIcon,
            },
        ],
    },
] as const
