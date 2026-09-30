import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { DEFAULT_LANGUAGE, DEFAULT_NAMESPACE, NAMESPACES } from './constants'

import { getStoredLanguage } from './language-storage'
import { resources } from './resources'

void i18n.use(initReactI18next).init({
    resources,

    lng: getStoredLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,

    ns: NAMESPACES,
    defaultNS: DEFAULT_NAMESPACE,

    interpolation: {
        escapeValue: false,
    },

    react: {
        useSuspense: true,
    },
})

export default i18n
