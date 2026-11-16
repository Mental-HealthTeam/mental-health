import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import './UserMenu.scss'
import { authApi, useLogoutMutation, useMeQuery } from '../../services/authApi'
import type { UserPublic } from '../../types/auth'
import { AnimatePresence, motion } from 'motion/react'
import { AvatarPlaceholder } from '../AvatarPlaceholder'
import classNames from 'classnames'

type Props = {
    className?: string
    variant?: 'full' | 'compact'
    noBackground?: boolean
    user: UserPublic
}

export const UserMenu = ({ user, className, variant = 'full', noBackground = false }: Props) => {
    const { t } = useTranslation('actions')
    const { data } = useMeQuery()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [logout] = useLogoutMutation()
    const [isOpen, setIsOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setIsOpen(false)
        }

        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const handleLogout = async () => {
        try {
            await logout().unwrap()
        } finally {
            dispatch(authApi.util.resetApiState())
            setIsOpen(false)
            navigate('/', { replace: true })
        }
    }

    const handleCabinet = () => {
        const role = data?.role

        switch (role) {
            case 'admin':
                navigate('/admin')
                break
            case 'client':
                navigate('/cabinet')
                break
            case 'psychologist':
                navigate('/specialist/cabinet')
                break

            default:
                navigate('/')
                break
        }
    }

    return (
        <div
            className={classNames('user-menu', `user-menu--${variant}`, className, {
                'user-menu--no-background': noBackground,
            })}
            ref={ref}
        >
            <button
                className="user-menu__trigger"
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-label={variant === 'compact' ? user.name : undefined}
                onClick={() => setIsOpen((prev) => !prev)}
            >
                <AvatarPlaceholder variant="small" className="user-menu__avatar" />
                <span className="user-menu__name">{user.name}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="user-menu__dropdown"
                        role="menu"
                        initial={{ opacity: 0, y: -20, scale: 0.86 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.86 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        <button
                            className="user-menu__item user-menu__item--logout"
                            type="button"
                            role="menuitem"
                            onClick={handleCabinet}
                        >
                            {t('cabinet')}
                        </button>

                        <div className="user-menu__divider" aria-hidden="true" />

                        <button
                            className="user-menu__item user-menu__item--logout"
                            type="button"
                            role="menuitem"
                            onClick={handleLogout}
                        >
                            {t('logout')}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
