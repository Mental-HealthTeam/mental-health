import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import './UserMenu.scss'
import { Avatar } from '../UI/Avatar'
import { authApi, useLogoutMutation } from '../../services/authApi'
import type { UserPublic } from '../../types/auth'
import { AvatarFallbackIcon } from '../UI/Icons'

type Props = { user: UserPublic }

export const UserMenu = ({ user }: Props) => {
    const { t } = useTranslation('actions')
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

    return (
        <div className="user-menu" ref={ref}>
            <button
                className="user-menu__trigger"
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="menu"
                onClick={() => setIsOpen((prev) => !prev)}
            >
                <Avatar
                    src={user.avatar_url ?? undefined}
                    fallback={<AvatarFallbackIcon />}
                    alt=""
                    size="small"
                    className="user-menu__avatar"
                />
                <span className="user-menu__name">{user.name}</span>
            </button>

            {isOpen && (
                <div className="user-menu__dropdown" role="menu">
                    <button
                        className="user-menu__item"
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                    >
                        {t('logout')}
                    </button>
                </div>
            )}
        </div>
    )
}
