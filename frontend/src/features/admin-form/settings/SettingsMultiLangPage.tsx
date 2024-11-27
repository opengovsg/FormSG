import { useSearchParams } from 'react-router-dom'
import _ from 'lodash'

import { TRANSLATION_INPUT, UNICODE_LOCALE } from '~constants/routes'

import { MultiLanguageSection } from './components/MultiLanguageSection/MultiLanguageSection'
import { TranslationListSection } from './components/MultiLanguageSection/TranslationListSection'
import { TranslationSection } from './components/MultiLanguageSection/TranslationSection'

export const SettingsMultiLangPage = (): JSX.Element => {
  const [searchParams] = useSearchParams()
  const unicodeLocale = searchParams.get(UNICODE_LOCALE)
  const translationInput = searchParams.get(TRANSLATION_INPUT)
  const isTranslationInput = !_.isNull(translationInput)
  const isEndPageTranslationInput = translationInput === 'endPage'
  const isStartPageTransltionInput = translationInput === 'startPage'

  // Request user to select a language
  if (!unicodeLocale) {
    return <MultiLanguageSection />
  }
  // Request user to select fields to translate
  if (!isTranslationInput) {
    return <TranslationListSection language={unicodeLocale} />
  }
  return (
    <TranslationSection
      language={unicodeLocale}
      formFieldNumToBeTranslated={
        isEndPageTranslationInput || isStartPageTransltionInput
          ? -1
          : _.toNumber(translationInput)
      }
      isEndPageTranslations={isEndPageTranslationInput}
      isStartPageTranslations={isStartPageTransltionInput}
    />
  )
}
