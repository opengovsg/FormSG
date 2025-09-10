import { FormResponseMode } from '~shared/types'

import AuthSettingsSection from './components/AuthSettingsSection'
import { CategoryHeader } from './components/CategoryHeader'
import { useAdminFormSettings } from './queries'

export const SettingsAuthPage = (): JSX.Element => {
  const { data: settings, isLoading } = useAdminFormSettings()

  return (
    <>
      <CategoryHeader>Singpass</CategoryHeader>
      <AuthSettingsSection />
    </>
  )
}
