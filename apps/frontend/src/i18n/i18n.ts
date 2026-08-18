import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import ICU from 'i18next-icu'

import { Language } from 'formsg-shared/types'

import { locales } from './locales'

i18n
  .use(ICU)
  .use(new LanguageDetector(null, { lookupLocalStorage: 'formsg-language' }))
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: locales,
    fallbackLng: Language.ENGLISH,
    debug: false,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    react: {
      // Wrap text nodes rendered by <Trans> in spans so browser translation
      // (which replaces bare text nodes with <font> elements) cannot crash
      // React reconciliation. See https://github.com/facebook/react/issues/11538
      transWrapTextNodes: 'span',
    },
  })
export default i18n
