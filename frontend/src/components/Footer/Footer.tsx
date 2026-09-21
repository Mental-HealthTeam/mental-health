import { Container } from '../Container'
import { navigationItems } from '../../constants/navigation'
import {
    clientLinks,
    legalLinks,
    specialistLinks,
} from '../../constants/footerLinks'
import logo from '../../assets/mental-health-logo.png'
import footerLeaf from '../../assets/decorations/footer-leaf.svg'
import footerCircle from '../../assets/decorations/footer-circle.svg'
import './Footer.scss'

export const Footer = () => {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="footer">
            <Container className="footer__container">
                <img
                    className="footer__decoration footer__decoration--leaf"
                    src={footerLeaf}
                    alt=""
                    aria-hidden="true"
                />

                <img
                    className="footer__decoration footer__decoration--circle"
                    src={footerCircle}
                    alt=""
                    aria-hidden="true"
                />
                <div className="footer__top">
                    <div className="footer__information">
                        <a
                            className="footer__logo"
                            href="#home"
                            aria-label="Mental Health — головна"
                        >
                            <img
                                src={logo}
                                alt="Mental Health Platform"
                            />
                        </a>

                        <p className="footer__description">
                            Професійна психологічна підтримка онлайн.
                            Знайдіть свого психолога та почніть шлях до
                            ментального здоров’я.
                        </p>

                        <address className="footer__contacts">
                            <a href="mailto:support@platform.com">
                                <span aria-hidden="true">✉</span>
                                support@platform.com
                            </a>

                            <a
                                href="https://www.instagram.com"
                                target="_blank"
                                rel="noreferrer"
                            >
                                <span aria-hidden="true">◎</span>
                                @support_bot
                            </a>

                            <a href="tel:+380441234567">
                                <span aria-hidden="true">⌕</span>
                                +380 (44) 123-45-67
                            </a>
                        </address>
                    </div>

                    <div className="footer__column">
                        <h2 className="footer__title">
                            Навігація
                        </h2>

                        <ul className="footer__links">
                            {navigationItems.map(({ label, href }) => (
                                <li key={href}>
                                    <a href={href}>{label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="footer__column">
                        <h2 className="footer__title">
                            Для клієнтів
                        </h2>

                        <ul className="footer__links">
                            {clientLinks.map(({ label, href }) => (
                                <li key={href}>
                                    <a href={href}>{label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="footer__column">
                        <h2 className="footer__title">
                            Для фахівців
                        </h2>

                        <ul className="footer__links">
                            {specialistLinks.map(({ label, href }) => (
                                <li key={href}>
                                    <a href={href}>{label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="footer__legal">
                    {legalLinks.map(({ label, href }, index) => (
                        <span className="footer__legal-item" key={href}>
              <a href={href}>{label}</a>

                            {index < legalLinks.length - 1 && (
                                <span
                                    className="footer__legal-separator"
                                    aria-hidden="true"
                                >
                  •
                </span>
                            )}
            </span>
                    ))}
                </div>

                <div className="footer__bottom">
                    <p className="footer__warning">
                        <strong>⚠ Увага:</strong> Mental Health Platform
                        надає консультативні психологічні послуги та не є
                        службою екстреної медичної або психіатричної
                        допомоги. У разі загрози життю зверніться за номером
                        103 або на гарячу лінію з питань психічного здоров’я.
                    </p>

                    <p className="footer__copyright">
                        © {currentYear} Mental Health Platform. Усі права
                        захищені.
                    </p>
                </div>
            </Container>
        </footer>
    )
}
