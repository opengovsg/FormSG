import { useTranslation } from 'react-i18next'

import { useUsesStepLoginRules } from '~features/admin-form/create/workflow/hooks/useUsesStepLoginRules'

import AuthSettingsSection from './components/AuthSettingsSection'
import { CategoryHeader } from './components/CategoryHeader'

export const SettingsAuthPage = (): JSX.Element => {
  const { t } = useTranslation()
  const usesStepLoginRules = useUsesStepLoginRules()

  return (
    <>
      <CategoryHeader>
        {usesStepLoginRules
          ? t('features.adminForm.settings.singpass.loginTitle')
          : t('features.adminForm.settings.singpass.title')}
      </CategoryHeader>
      <AuthSettingsSection />
    </>
  )
}
