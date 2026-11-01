import { FooterCircleCloseIcon, FooterEmailIcon, FooterPhoneIcon } from '../components/UI/Icons'

export const FOOTER_CONTACTS = [
    {
        id: 'email',
        label: 'support@platform.com',
        href: 'mailto:support@platform.com',
        icon: <FooterEmailIcon />,
    },
    {
        id: 'telegram',
        label: '@support_bot',
        href: 'https://t.me/support_bot',
        icon: <FooterCircleCloseIcon />,
    },
    {
        id: 'phone',
        label: '+380 (44) 123-45-67',
        href: 'tel:+380441234567',
        icon: <FooterPhoneIcon />,
    },
] as const
