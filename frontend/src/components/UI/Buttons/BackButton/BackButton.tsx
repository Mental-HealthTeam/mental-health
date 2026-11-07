import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import './BackButton.scss'

type Props = {
    className?: string
}

export const BackButton = ({ className }: Props) => {
    const { t } = useTranslation('common')
    const navigate = useNavigate()
    const location = useLocation()
    const [searchParams] = useSearchParams()

    const handleBack = () => {
        const returnTo = searchParams.get('returnTo')

        if (returnTo?.startsWith('/') && !returnTo.startsWith('//') && !returnTo.includes('\\')) {
            navigate(returnTo)
            return
        }

        if (location.key === 'default') {
            navigate('/')
            return
        }

        navigate(-1)
    }

    return (
        <button className={classNames('back-button', className)} type="button" onClick={handleBack}>
            {t('back')}
        </button>
    )
}
