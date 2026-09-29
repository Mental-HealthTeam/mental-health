import { useTranslation } from 'react-i18next'

import { Container } from '../Container'
import { LogoIcon } from '../UI/Icons/LogoIcon'

import { footerNavigationItems } from '../../constants/navigation'
import { clientLinks, legalLinks, specialistLinks } from '../../constants/footerLinks'

import './Footer.scss'

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
                                textColor="#FFFFFF"
                                className="footer__logo-icon"
                                aria-hidden="true"
                            />
                        </a>

                        <p className="footer__description">{tFooter('description')}</p>
                    </div>

                    <nav className="footer__column" aria-labelledby="footer-navigation-title">
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

                    <nav className="footer__column" aria-labelledby="footer-clients-title">
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

                    <nav className="footer__column" aria-labelledby="footer-specialists-title">
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
                        <span aria-hidden="true">© </span>
                        {currentYear} {tFooter('copyright')}
                    </p>
                </div>
            </Container>
        </footer>
    )
}
