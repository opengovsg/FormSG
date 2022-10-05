import { useAdminFormSettings } from '../../queries'

import {
  AuthSettingsSection,
  AuthSettingsSectionSkeleton,
} from './AuthSettingsSection'

export const AuthSettingsSectionContainer = (): JSX.Element => {
  const { data: settings } = useAdminFormSettings()

  return settings ? (
    <AuthSettingsSection settings={settings} />
  ) : (
    <AuthSettingsSectionSkeleton />
  )
}
