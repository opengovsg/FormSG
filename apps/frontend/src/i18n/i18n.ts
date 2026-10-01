import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import ICU from 'i18next-icu'

import { Language } from 'formsg-shared/types/form/form_enums'

import { locales } from './locales'

// Storybook and tests fail on a missing key instead of rendering the key. A
// story that renders a namespace it never imports would otherwise pass on one
// registered by an earlier story in the same iframe, and TurboSnap would then
// skip it when that namespace changes.
const throwOnMissingKey = !!(
  import.meta.env.STORYBOOK || import.meta.env.VITEST
)

i18n
  .use(ICU)
  .use(new LanguageDetector(null, { lookupLocalStorage: 'formsg-language' }))
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: locales,
    fallbackLng: Language.ENGLISH,
    debug: false,
    saveMissing: throwOnMissingKey,
    missingKeyHandler: throwOnMissingKey
      ? (_lngs, ns, key) => {
          throw new Error(`Missing translation: ${ns}:${key}`)
        }
      : false,
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
