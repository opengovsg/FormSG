import { useAdminFormSettings } from '../../queries'

import { AuthSettingsSection } from './AuthSettingsSection'
import { AuthSettingsSectionSkeleton } from './AuthSettingsSectionSkeleton'

export const AuthSettingsSectionContainer = (): JSX.Element => {
  const { data: settings } = useAdminFormSettings()

  return settings ? (
    <AuthSettingsSection settings={settings} />
  ) : (
    <AuthSettingsSectionSkeleton />
  )
}
