import { useTranslation } from 'react-i18next'

import { CategoryHeader } from '../CategoryHeader'

import { FormMultiLanguageToggle } from './FormMultiLanguageToggle'

export const MultiLanguageSection = (): JSX.Element => {
  const { t } = useTranslation()

  return (
    <>
      <CategoryHeader>
        {t('features.adminForm.settings.multiLanguage.title')}
      </CategoryHeader>
      <FormMultiLanguageToggle />
    </>
  )
}
