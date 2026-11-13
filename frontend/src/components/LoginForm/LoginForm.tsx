import classNames from 'classnames'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GoogleLogin } from '@react-oauth/google'
import type { CredentialResponse } from '@react-oauth/google'

import './LoginForm.scss'
import { OutlineButton } from '../UI/Buttons'
import { useGoogleLoginMutation } from '../../services/authApi'
import type { UserPublic } from '../../types/auth'
import { GoogleIcon, LogoIcon } from '../UI/Icons'

type Props = {
    className?: string
    onSuccess: (user: UserPublic) => void
    onRegisterClick: () => void
}

export const LoginForm = ({ className, onSuccess, onRegisterClick }: Props) => {
    const { t } = useTranslation('login')
    const [googleLogin] = useGoogleLoginMutation()
    const [error, setError] = useState<string | null>(null)

    const hasError = error !== null

    const handleSuccess = async ({ credential }: CredentialResponse) => {
        if (!credential) {
            setError(t('errorGoogle'))
            return
        }

        setError(null)

        try {
            const user = await googleLogin({ credential }).unwrap()
            onSuccess(user)
        } catch (err) {
            const status = (err as { status?: number }).status
            setError(status === 403 ? t('errorOrigin') : t('errorEmail'))
        }
    }

    return (
        <div className={classNames('login-form', className)}>
            <LogoIcon variant="login" />
            <h1 className="login-form__title">{t('title')}</h1>

            <div
                className={classNames('login-form__card', { 'login-form__card--error': hasError })}
            >
                <h2
                    className={classNames('login-form__card-title', {
                        'login-form__card-title--error': hasError,
                    })}
                >
                    {hasError ? t('errorTitle') : t('cardTitle')}
                </h2>

                <div className="login-form__google">
                    <OutlineButton
                        variant="secondary"
                        className="login-form__google-fake"
                        tabIndex={-1}
                        aria-hidden="true"
                        startIcon={<GoogleIcon />}
                    >
                        {t('google')}
                    </OutlineButton>

                    <div className="login-form__google-real">
                        <GoogleLogin
                            onSuccess={handleSuccess}
                            onError={() => setError(t('errorGoogle'))}
                            size="large"
                            width="228"
                        />
                    </div>
                </div>

                {hasError ? (
                    <p className="login-form__error" role="alert">
                        {error}
                    </p>
                ) : (
                    <>
                        <p className="login-form__terms">{t('terms')}</p>

                        <div className="login-form__register">
                            <span className="login-form__register-text">{t('noAccount')}</span>
                            <OutlineButton
                                className="login-form__register-button"
                                variant="secondary"
                                onClick={onRegisterClick}
                            >
                                {t('register')}
                            </OutlineButton>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
