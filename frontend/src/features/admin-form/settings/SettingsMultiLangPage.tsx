import { useParams } from 'react-router-dom'

import { MultiLanguageSection } from './components/MultiLanguageSection/MultiLanguageSection'
import { TranslationListSection } from './components/MultiLanguageSection/TranslationListSection'

export const SettingsMultiLangPage = (): JSX.Element => {
  const { language } = useParams()

  return (
    <>
      {!language ? <MultiLanguageSection /> : null}
      {language ? <TranslationListSection language={language} /> : null}
    </>
  )
}
