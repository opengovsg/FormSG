import { useTranslation } from 'react-i18next'

import AuthSettingsSection from './components/AuthSettingsSection'
import { CategoryHeader } from './components/CategoryHeader'

export const SettingsAuthPage = (): JSX.Element => {
  const { t } = useTranslation()

  return (
    <>
      <CategoryHeader>
        {t('features.adminForm.settings.singpass.title')}
      </CategoryHeader>
      <AuthSettingsSection />
    </>
  )
}
