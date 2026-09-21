import {
    useEffect,
    useState,
} from 'react'
import classNames from 'classnames'
import { navigationItems } from '../../constants/navigation'
import './Navigation.scss'

type Props = {
    className?: string
    onNavigate?: () => void
}

const getCurrentHash = () => {
    return window.location.hash || '#home'
}

export const Navigation = ({
                               className,
                               onNavigate,
                           }: Props) => {
    const [activeHref, setActiveHref] = useState(getCurrentHash)

    useEffect(() => {
        const handleHashChange = () => {
            setActiveHref(getCurrentHash())
        }

        window.addEventListener('hashchange', handleHashChange)

        return () => {
            window.removeEventListener(
                'hashchange',
                handleHashChange,
            )
        }
    }, [])

    const handleNavigate = (href: string) => {
        setActiveHref(href)
        onNavigate?.()
    }

    return (
        <nav
            className={classNames('navigation', className)}
            aria-label="Головна навігація"
        >
            {navigationItems.map(({ label, href }) => (
                <a
                    className={classNames(
                        'navigation__link',
                        {
                            'navigation__link--active':
                                activeHref === href,
                        },
                    )}
                    href={href}
                    key={href}
                    aria-current={
                        activeHref === href
                            ? 'page'
                            : undefined
                    }
                    onClick={() => handleNavigate(href)}
                >
                    {label}
                </a>
            ))}
        </nav>
    )
}
