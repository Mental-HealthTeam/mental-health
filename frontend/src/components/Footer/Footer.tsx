import { useTranslation } from 'react-i18next'

import { footerNavigationItems } from '../../constants/navigation'
import { clientLinks, legalLinks, specialistLinks } from '../../constants/footerLinks'

import { Container } from '../Container'
import { LogoIcon } from '../UI/Icons'

import './Footer.scss'
import { FOOTER_CONTACTS } from '../../constants/footerContacts.tsx'

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
                                variant="footer"
                                className="footer__logo-icon"
                                aria-hidden="true"
                            />
                        </a>

                        <p className="footer__description">
                            <span>{tFooter('description.first')}</span>{' '}
                            <span className="footer__description-second">
                                {tFooter('description.second')}
                            </span>
                        </p>

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
                        className="footer__legal"
                        aria-label={tAccessibility('footerLegalNavigation')}
                    >
                        <ul className="footer__legal-links">
                            {legalLinks.map(({ key, href }) => (
                                <li className="footer__legal-item" key={href}>
                                    <a href={href}>{tFooter(`legal.${key}`)}</a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                <div className="footer__bottom">
                    <p className="footer__warning">
                        <strong className="footer__warning-title">
                            <span aria-hidden="true">⚕ </span>
                            {tFooter('warning.title')}
                        </strong>{' '}
                        {tFooter('warning.text')}{' '}
                        <span className="footer__warning-phone">{tFooter('warning.phone')}</span>{' '}
                        {tFooter('warning.afterPhone')}
                    </p>

                    <p className="footer__copyright">
                        © {currentYear} {tFooter('copyright')}
                    </p>
                </div>
            </Container>
        </footer>
    )
}
