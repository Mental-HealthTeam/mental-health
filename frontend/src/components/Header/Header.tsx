import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import classNames from 'classnames'

import { headerNavigationItems } from '../../constants/navigation'

import { Container } from '../Container'
import { LanguageSwitcher } from '../LanguageSwitcher'
import { OutlineButton, PrimaryButton } from '../UI/Buttons'
import { ArrowIcon, CloseIcon, LogoIcon, MenuIcon, SparkIcon } from '../UI/Icons'

import './Header.scss'
import { useAppDispatch } from '../../app/hooks'
import { openAiChat } from '../../app/store/slices/aiChatSlice'

export const Header = () => {
    const dispatch = useAppDispatch()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [activeHref, setActiveHref] = useState('#about')

    const currentYear = new Date().getFullYear()

    const { t: tActions } = useTranslation('actions')
    const { t: tAccessibility } = useTranslation('accessibility')
    const { t: tNavigation } = useTranslation('navigation')

    const closeMenu = () => {
        setIsMenuOpen(false)
    }

    const toggleMenu = () => {
        setIsMenuOpen((currentValue) => !currentValue)
    }

    const handleNavigation = (href: string) => {
        setActiveHref(href)
        closeMenu()

        document.querySelector(href)?.scrollIntoView({
            behavior: 'smooth',
        })
    }

    const handleOpenChat = () => {
        closeMenu()
        dispatch(openAiChat())
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
            <Container
                className={classNames('header__container', {
                    'header__container--menu-open': isMenuOpen,
                })}
            >
                <div className="header__top">
                    <a
                        className="header__logo"
                        href="/"
                        aria-label={tAccessibility('homeLink')}
                        onClick={closeMenu}
                    >
                        <LogoIcon className="header__logo-icon" />
                    </a>

                    <div className="header__content">
                        <nav
                            className="header__navigation"
                            aria-label={tAccessibility('mainNavigation')}
                        >
                            <ul className="header__navigation-list">
                                {headerNavigationItems.map(({ href, key }) => {
                                    const isActive = activeHref === href

                                    return (
                                        <li key={href}>
                                            <button
                                                className={classNames('header__navigation-link', {
                                                    'header__navigation-link--active': isActive,
                                                })}
                                                type="button"
                                                aria-current={isActive ? 'page' : undefined}
                                                onClick={() => handleNavigation(href)}
                                            >
                                                {tNavigation(key)}
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>
                        </nav>

                        <div className="header__actions">
                            <PrimaryButton
                                className="header__ai-button"
                                startIcon={<SparkIcon />}
                                endIcon={
                                    <span className="header__ai-arrow">
                                        <ArrowIcon />
                                    </span>
                                }
                                aria-label={tActions('findPsychologist')}
                                onClick={handleOpenChat}
                            >
                                <span className="header__ai-label">
                                    {tActions('findPsychologist')}
                                </span>
                            </PrimaryButton>

                            <span className="header__divider" aria-hidden="true" />

                            <div className="header__auth">
                                <OutlineButton
                                    className="header__login-button"
                                    variant="tertiary"
                                    onClick={() => handleNavigation('#login')}
                                >
                                    {tActions('login')}
                                </OutlineButton>

                                <OutlineButton
                                    className="header__register-button"
                                    variant="secondary"
                                    onClick={() => handleNavigation('#register')}
                                >
                                    {tActions('register')}
                                </OutlineButton>
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
                                <span
                                    className={classNames('header__menu-icon', {
                                        'header__menu-icon--hidden': isMenuOpen,
                                    })}
                                    aria-hidden="true"
                                >
                                    <MenuIcon />
                                </span>

                                <span
                                    className={classNames('header__close-icon', {
                                        'header__close-icon--visible': isMenuOpen,
                                    })}
                                    aria-hidden="true"
                                >
                                    <CloseIcon />
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={classNames('header__mobile-menu', {
                        'header__mobile-menu--open': isMenuOpen,
                    })}
                    id="header-mobile-menu"
                >
                    <div className="header__mobile-menu-inner">
                        <div className="header__mobile-divider" />

                        <div className="header__mobile-register">
                            <OutlineButton
                                variant="secondary"
                                onClick={() => handleNavigation('#register')}
                            >
                                {tActions('register')}
                            </OutlineButton>
                        </div>

                        <div className="header__mobile-divider" />

                        <nav
                            className="header__mobile-navigation"
                            aria-label={tAccessibility('mainNavigation')}
                        >
                            <ul className="header__mobile-navigation-list">
                                {headerNavigationItems.map(({ href, key }) => {
                                    const isActive = activeHref === href

                                    return (
                                        <li key={href}>
                                            <button
                                                className={classNames(
                                                    'header__mobile-navigation-link',
                                                    {
                                                        'header__mobile-navigation-link--active':
                                                            isActive,
                                                    },
                                                )}
                                                type="button"
                                                aria-current={isActive ? 'page' : undefined}
                                                onClick={() => handleNavigation(href)}
                                            >
                                                {tNavigation(key)}
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>
                        </nav>

                        <p className="header__mobile-copyright">
                            Mental Health Platform © {currentYear}
                        </p>
                    </div>
                </div>

                <LanguageSwitcher className="header__language-switcher" />
            </Container>
        </header>
    )
}
