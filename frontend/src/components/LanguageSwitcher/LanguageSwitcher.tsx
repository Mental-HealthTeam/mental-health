import classNames from 'classnames'
import { useTranslation } from 'react-i18next'

import { changeLanguage } from '../../i18n/change-language'

import './LanguageSwitcher.scss'

type Props = {
    className?: string
}

export const LanguageSwitcher = ({ className }: Props) => {
    const { i18n, t } = useTranslation('accessibility')

    const currentLanguage = i18n.resolvedLanguage

    const handleLanguageChange = (language: 'uk' | 'en') => {
        if (currentLanguage === language) {
            return
        }

        void changeLanguage(language)
    }

    return (
        <div
            className={classNames('language-switcher', className)}
            role="group"
            aria-label={t('changeLanguage')}
        >
            <button
                type="button"
                className={classNames('language-switcher__button', {
                    'language-switcher__button--active': currentLanguage === 'uk',
                })}
                aria-pressed={currentLanguage === 'uk'}
                onClick={() => handleLanguageChange('uk')}
            >
                УКР
            </button>

            <button
                type="button"
                className={classNames('language-switcher__button', {
                    'language-switcher__button--active': currentLanguage === 'en',
                })}
                aria-pressed={currentLanguage === 'en'}
                onClick={() => handleLanguageChange('en')}
            >
                ENG
            </button>
        </div>
    )
}
