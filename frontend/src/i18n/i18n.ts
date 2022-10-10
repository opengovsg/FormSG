import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import ICU from 'i18next-icu'

import { locales } from './locales'

i18n
  .use(ICU)
  .use(new LanguageDetector(null, { lookupLocalStorage: 'formsg-language' }))
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: locales,
    fallbackLng: 'en-SG',
    debug: false,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  })
export default i18n
