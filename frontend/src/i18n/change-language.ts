import i18n from './config'
import { saveLanguage } from './language-storage'
import type { Language } from './constants'

export const changeLanguage = async (language: Language) => {
    await i18n.changeLanguage(language)

    saveLanguage(language)
}
