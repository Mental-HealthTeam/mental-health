import { Navigate, useNavigate } from 'react-router-dom'
import { LoginForm } from '../../components/LoginForm'
import { Container } from '../../components/Container'
import { useMeQuery } from '../../services/authApi'
import type { Role } from '../../types/auth'
import { BackButton } from '../../components/UI/Buttons/BackButton'

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

    if (isLoading) {
        return null
    }

    if (user) {
        return <Navigate to={getHomePath(user.role)} replace />
    }

    return (
        <div className="sign-in">
            <main className="sign-in__content">
                <Container className="sign-in__container">
                    <BackButton />

                    <LoginForm
                        className="sign-in__login-form"
                        onSuccess={(user) =>
                            navigate(user.role === 'psychologist' ? '/specialist/cabinet' : '/', {
                                replace: true,
                            })
                        }
                        onRegisterClick={() => navigate('/sign-up')}
                    />
                </Container>
            </main>
        </div>
    )
}
