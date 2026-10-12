import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import classNames from 'classnames'

import { Container } from '../Container'
import { LanguageSwitcher } from '../LanguageSwitcher'
import { Navigation } from '../Navigation'
import { Button } from '../UI/Button'

import { headerNavigationItems } from '../../constants/navigation'

import './Header.scss'
import { ArrowIcon, LogoIcon, MenuIcon, SparkIcon } from '../UI/Icons'

export const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const { t: tActions } = useTranslation('actions')
    const { t: tAccessibility } = useTranslation('accessibility')

    const toggleMenu = () => {
        setIsMenuOpen((currentValue) => !currentValue)
    }

    const closeMenu = () => {
        setIsMenuOpen(false)
    }

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeMenu()
            }
        }

        window.addEventListener('keydown', handleEscape)

        return () => {
            window.removeEventListener('keydown', handleEscape)
        }
    }, [])

    return (
        <header className="header">
            <Container className="header__container">
                <a
                    className="header__logo"
                    href="#home"
                    aria-label={tAccessibility('homeLink')}
                    onClick={closeMenu}
                >
                    <LogoIcon className="header__logo-icon" />
                </a>

                <div className="header__content">
                    <Navigation items={headerNavigationItems} className="header__navigation" />

                    <div className="header__actions">
                        <Button
                            className="header__ai-button"
                            href="#ai-search"
                            variant="primary"
                            size="large"
                            startIcon={<SparkIcon />}
                            endIcon={<ArrowIcon />}
                            ariaLabel={tActions('findPsychologist')}
                            onClick={closeMenu}
                        >
                            {tActions('findPsychologist')}
                        </Button>

                        <span className="header__divider" aria-hidden="true" />

                        <div className="header__auth">
                            <Button
                                className="header__login-button"
                                href="#login"
                                variant="secondary"
                                size="medium"
                                onClick={closeMenu}
                            >
                                {tActions('login')}
                            </Button>

                            <Button
                                className="header__register-button"
                                href="#register"
                                variant="primary"
                                size="medium"
                                onClick={closeMenu}
                            >
                                {tActions('register')}
                            </Button>
                        </div>

                        <button
                            className={classNames('header__menu-button', {
                                'header__menu-button--open': isMenuOpen,
                            })}
                            type="button"
                            aria-label={
                                isMenuOpen
                                    ? tAccessibility('closeMenu')
                                    : tAccessibility('openMenu')
                            }
                            aria-expanded={isMenuOpen}
                            aria-controls="header-mobile-menu"
                            onClick={toggleMenu}
                        >
                            <MenuIcon />
                        </button>
                    </div>
                </div>

                <div
                    className={classNames('header__mobile-menu', {
                        'header__mobile-menu--open': isMenuOpen,
                    })}
                    id="header-mobile-menu"
                >
                    <Navigation items={headerNavigationItems} onNavigate={closeMenu} />

                    <Button
                        href="#register"
                        variant="primary"
                        size="medium"
                        fullWidth
                        onClick={closeMenu}
                    >
                        {tActions('register')}
                    </Button>
                </div>

                <LanguageSwitcher className="header__language-switcher" />
            </Container>
        </header>
    )
}
