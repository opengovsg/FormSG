import { useSearchParams } from 'react-router-dom'

import { MultiLanguageSection } from './components/MultiLanguageSection/MultiLanguageSection'
import { TranslationListSection } from './components/MultiLanguageSection/TranslationListSection'

export const SettingsMultiLangPage = (): JSX.Element => {
  const [searchParams] = useSearchParams()
  const unicodeLocale = searchParams.get('unicodeLocale')

  return (
    <>
      {unicodeLocale ? <TranslationListSection language={unicodeLocale} /> : <MultiLanguageSection />}
    </>
  )
}
