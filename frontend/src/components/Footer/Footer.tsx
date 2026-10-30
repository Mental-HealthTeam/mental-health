import { useTranslation } from 'react-i18next'

import { footerNavigationItems } from '../../constants/navigation'
import { clientLinks, legalLinks, specialistLinks } from '../../constants/footerLinks'

import { Container } from '../Container'
import { LogoIcon } from '../UI/Icons'

import './Footer.scss'

const FOOTER_CONTACTS = [
    {
        id: 'email',
        label: 'support@platform.com',
        href: 'mailto:support@platform.com',
        icon: '✉',
    },
    {
        id: 'telegram',
        label: '@support_bot',
        href: 'https://t.me/support_bot',
        icon: '@',
    },
    {
        id: 'phone',
        label: '+380 (44) 123-45-67',
        href: 'tel:+380441234567',
        icon: '⌕',
    },
] as const

export const Footer = () => {
    const currentYear = new Date().getFullYear()

    const { t: tAccessibility } = useTranslation('accessibility')
    const { t: tNavigation } = useTranslation('navigation')
    const { t: tFooter } = useTranslation('footer')

    return (
        <footer className="footer" aria-label={tAccessibility('footer')}>
            <Container className="footer__container">
                <div className="footer__top">
                    <div className="footer__information">
                        <a
                            className="footer__logo"
                            href="#home"
                            aria-label={tAccessibility('homeLink')}
                        >
                            <LogoIcon
                                variant={'footer'}
                                className="footer__logo-icon"
                                aria-hidden="true"
                            />
                        </a>

                        <p className="footer__description">{tFooter('description')}</p>

                        <ul className="footer__contacts">
                            {FOOTER_CONTACTS.map(({ id, label, href, icon }) => (
                                <li className="footer__contact-item" key={id}>
                                    <a className="footer__contact-link" href={href}>
                                        <span className="footer__contact-icon" aria-hidden="true">
                                            {icon}
                                        </span>

                                        <span>{label}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <nav
                        className="footer__column footer__column--navigation"
                        aria-labelledby="footer-navigation-title"
                    >
                        <h2 className="footer__title" id="footer-navigation-title">
                            {tFooter('sections.navigation')}
                        </h2>

                        <ul className="footer__links">
                            {footerNavigationItems.map(({ href, key }) => (
                                <li key={href}>
                                    <a href={href}>{tNavigation(key)}</a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <nav
                        className="footer__column footer__column--clients"
                        aria-labelledby="footer-clients-title"
                    >
                        <h2 className="footer__title" id="footer-clients-title">
                            {tFooter('sections.clients')}
                        </h2>

                        <ul className="footer__links">
                            {clientLinks.map(({ key, href }) => (
                                <li key={href}>
                                    <a href={href}>{tFooter(`clients.${key}`)}</a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <nav
                        className="footer__column footer__column--specialists"
                        aria-labelledby="footer-specialists-title"
                    >
                        <h2 className="footer__title" id="footer-specialists-title">
                            {tFooter('sections.specialists')}
                        </h2>

                        <ul className="footer__links">
                            {specialistLinks.map(({ key, href }) => (
                                <li key={href}>
                                    <a href={href}>{tFooter(`specialists.${key}`)}</a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <nav
                        className="footer__mobile-legal"
                        aria-label={tAccessibility('footerLegalNavigation')}
                    >
                        <ul className="footer__links">
                            {legalLinks.map(({ key, href }) => (
                                <li key={href}>
                                    <a href={href}>{tFooter(`legal.${key}`)}</a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                <nav className="footer__legal" aria-label={tAccessibility('footerLegalNavigation')}>
                    {legalLinks.map(({ key, href }, index) => (
                        <span className="footer__legal-item" key={href}>
                            <a href={href}>{tFooter(`legal.${key}`)}</a>

                            {index < legalLinks.length - 1 && (
                                <span className="footer__legal-separator" aria-hidden="true">
                                    •
                                </span>
                            )}
                        </span>
                    ))}
                </nav>

                <div className="footer__bottom">
                    <p className="footer__warning">
                        <strong>
                            <span aria-hidden="true">⚠ </span>
                            {tFooter('warning.title')}
                        </strong>{' '}
                        {tFooter('warning.text')}
                    </p>

                    <p className="footer__copyright">
                        © {currentYear} {tFooter('copyright')}
                    </p>
                </div>
            </Container>
        </footer>
    )
}
