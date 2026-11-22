import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LoginForm } from '../../components/LoginForm'
import { Container } from '../../components/Container'
import { useMeQuery } from '../../services/authApi'
import type { Role } from '../../types/auth'
import { BackButton } from '../../components/UI/Buttons'

import './SignIn.scss'

const getHomePath = (role: Role) => {
    switch (role) {
        case 'client':
            return '/cabinet'

        case 'psychologist':
            return '/specialist/cabinet'

        case 'admin':
            return '/'

        default:
            return '/'
    }
}

export const SignIn = () => {
    const { data: user, isLoading } = useMeQuery()
    const navigate = useNavigate()
    const location = useLocation()

    const state = location.state as { from?: string } | null
    const from = state?.from

    const returnPath =
        typeof from === 'string' &&
        from.startsWith('/') &&
        !from.startsWith('//') &&
        from.split(/[?#]/)[0] !== '/sign-in'
            ? from
            : null

    if (isLoading) {
        return null
    }

    if (user) {
        return <Navigate to={returnPath ?? getHomePath(user.role)} replace />
    }

    return (
        <div className="sign-in">
            <main className="sign-in__content">
                <Container className="sign-in__container">
                    <BackButton />

                    <LoginForm
                        className="sign-in__login-form"
                        onSuccess={(user) =>
                            navigate(
                                returnPath ??
                                    (user.role === 'psychologist' ? '/specialist/cabinet' : '/'),
                                { replace: true },
                            )
                        }
                        onRegisterClick={() =>
                            navigate('/sign-up', {
                                state: returnPath ? { from: returnPath } : undefined,
                            })
                        }
                    />
                </Container>
            </main>
        </div>
    )
}
