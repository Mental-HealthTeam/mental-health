import { useEffect, useState } from 'react'
import classNames from 'classnames'
import { Container } from '../Container'
import { Navigation } from '../Navigation'
import { Button } from '../UI/Button'
import {
    ArrowRightIcon,
    MenuIcon,
    SparkIcon,
} from '../UI/Icons'
import logo from '../../assets/mental-health-logo.png'
import './Header.scss'

export const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

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
                    aria-label="Mental Health — головна"
                    onClick={closeMenu}
                >
                    <img
                        src={logo}
                        alt="Mental Health Platform"
                    />
                </a>

                <button
                    className={classNames(
                        'header__menu-button',
                        {
                            'header__menu-button--open': isMenuOpen,
                        },
                    )}
                    type="button"
                    aria-label={
                        isMenuOpen
                            ? 'Закрити меню'
                            : 'Відкрити меню'
                    }
                    aria-expanded={isMenuOpen}
                    aria-controls="header-content"
                    onClick={toggleMenu}
                >
                    <MenuIcon isOpen={isMenuOpen} />
                </button>

                <div
                    className={classNames(
                        'header__content',
                        {
                            'header__content--open': isMenuOpen,
                        },
                    )}
                    id="header-content"
                >
                    <Navigation
                        className="header__navigation"
                        onNavigate={closeMenu}
                    />

                    <div className="header__actions">
                        <Button
                            className="header__ai-button"
                            href="#ai-search"
                            variant="primary"
                            size="large"
                            startIcon={<SparkIcon />}
                            endIcon={<ArrowRightIcon />}
                            onClick={closeMenu}
                        >
                            Знайди свого психолога з AI
                        </Button>

                        <span
                            className="header__divider"
                            aria-hidden="true"
                        />

                        <Button
                            className="header__login-button"
                            href="#login"
                            variant="outline"
                            onClick={closeMenu}
                        >
                            Увійти
                        </Button>

                        <Button
                            className="header__register-button"
                            href="#register"
                            variant="primary"
                            onClick={closeMenu}
                        >
                            Зареєструватися
                        </Button>
                    </div>
                </div>
            </Container>
        </header>
    )
}
