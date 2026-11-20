import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import classNames from 'classnames'

import { authApi, useLogoutMutation } from '../../services/authApi'
import type { UserPublic } from '../../types/auth'

import { Avatar } from '../UI/Avatar'
import { AvatarPlaceholderIcon } from '../UI/Icons'

import './UserMenu.scss'

type Props = {
    className?: string
    variant?: 'full' | 'compact'
    noBackground?: boolean
    user: UserPublic
}

export const UserMenu = ({ user, className, variant = 'full', noBackground = false }: Props) => {
    const { t } = useTranslation('actions')
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const [logout] = useLogoutMutation()
    const [isOpen, setIsOpen] = useState(false)

    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (!ref.current?.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClick)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handleClick)
            document.removeEventListener('keydown', handleEscape)
        }
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
        setIsOpen(false)

        switch (user.role) {
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
            ref={ref}
            className={classNames('user-menu', `user-menu--${variant}`, className, {
                'user-menu--no-background': noBackground,
            })}
        >
            <button
                className="user-menu__trigger"
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-label={variant === 'compact' ? (user.name ?? user.email) : undefined}
                onClick={() => setIsOpen((prev) => !prev)}
            >
                <Avatar
                    src={user.avatar_url ?? undefined}
                    alt=""
                    size="small"
                    className="user-menu__avatar"
                    fallback={<AvatarPlaceholderIcon className="user-menu__avatar-icon" />}
                />

                <span className="user-menu__name">{user.name ?? user.email}</span>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        className="user-menu__dropdown"
                        role="menu"
                        initial={{
                            opacity: 0,
                            y: -10,
                            scale: 0.96,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            y: -10,
                            scale: 0.96,
                        }}
                        transition={{
                            duration: 0.2,
                            ease: 'easeOut',
                        }}
                        style={{
                            transformOrigin: 'top right',
                        }}
                    >
                        <button
                            className="user-menu__item"
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
