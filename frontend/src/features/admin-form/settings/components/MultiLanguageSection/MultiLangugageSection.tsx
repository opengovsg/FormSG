import { useState } from 'react'

import { Language } from '~shared/types'

import { CategoryHeader } from '../CategoryHeader'

import { FormMultiLangToggle } from './FormMultiLangToggle'
import { TranslationSection } from './TranslationListSection'

export const MultiLanguageSection = (): JSX.Element => {
  const [isTogglePage, setIsTogglePage] = useState(true)
  const [translationLanguage, setTranslationLanguage] = useState(
    Language.ENGLISH,
  )

  return isTogglePage ? (
    <>
      <CategoryHeader>Multi-language</CategoryHeader>
      <FormMultiLangToggle
        setIsFormToggle={setIsTogglePage}
        setTranslationLanguage={setTranslationLanguage}
      />
    </>
  ) : (
    <TranslationSection
      language={translationLanguage}
      setIsFormToggle={setIsTogglePage}
    />
  )
}
