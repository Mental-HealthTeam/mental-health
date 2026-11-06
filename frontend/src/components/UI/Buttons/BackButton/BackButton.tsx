import { useTranslation } from 'react-i18next'

import './BackButton.scss'
import classNames from 'classnames'
import { useLocation, useNavigate } from 'react-router-dom'

type Props = {
    className?: string
}

export const BackButton = ({ className }: Props) => {
    const { t } = useTranslation('common')
    const navigate = useNavigate()
    const location = useLocation()

    const handleBack = () => {
        if (location.key === 'default') {
            navigate('/')
        } else {
            navigate(-1)
        }
    }

    return (
        <button
            className={classNames('back-button', className)}
            type="button"
            onClick={handleBack}
        >
            {t('back')}
        </button>
    )
}
