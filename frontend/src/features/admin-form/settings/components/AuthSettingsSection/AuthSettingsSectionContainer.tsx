import { useAdminFormSettings } from '../../queries'

import { AuthSettingsSection } from './AuthSettingsSection'

export const AuthSettingsSectionContainer = (): JSX.Element => {
  const { data: settings } = useAdminFormSettings()

  return <AuthSettingsSection settings={settings} />
}
