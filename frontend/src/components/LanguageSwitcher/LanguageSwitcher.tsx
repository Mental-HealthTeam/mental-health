import classNames from 'classnames'
import { useTranslation } from 'react-i18next'

import { changeLanguage } from '../../i18n/change-language'

import './LanguageSwitcher.scss'

type Props = {
    className?: string
}

export const LanguageSwitcher = ({ className }: Props) => {
    const { i18n, t } = useTranslation('accessibility')

    const isEnglish = i18n.resolvedLanguage === 'en'

    const handleToggle = () => {
        void changeLanguage(isEnglish ? 'uk' : 'en')
    }

    return (
        <div className={classNames('language-switcher', className)}>
            <span
                className={classNames('language-switcher__label', {
                    'language-switcher__label--active': !isEnglish,
                })}
            >
                UA
            </span>

            <button
                type="button"
                className="language-switcher__toggle"
                aria-label={t('changeLanguage')}
                aria-pressed={isEnglish}
                onClick={handleToggle}
            >
                <span className="language-switcher__thumb" data-active={isEnglish} />
            </button>

            <span
                className={classNames('language-switcher__label', {
                    'language-switcher__label--active': isEnglish,
                })}
            >
                EN
            </span>
        </div>
    )
}
