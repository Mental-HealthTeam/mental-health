import classNames from 'classnames'
import './TypingIndicator.scss'
import { PenIcon } from '../../UI/Icons'
import { useTranslation } from 'react-i18next'

type Props = {
    className?: string
}

export const TypingIndicator = ({ className }: Props) => {
    const { t } = useTranslation('aiChat')

    return (
        <div className={classNames('typing-indicator', className)}>
            <PenIcon className="typing-indicator__icon" />
            <div className="typing-indicator__text">{t('typing.text')}</div>
        </div>
    )
}
