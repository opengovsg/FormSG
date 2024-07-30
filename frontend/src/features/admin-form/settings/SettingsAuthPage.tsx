import { FormResponseMode } from '~shared/types'

import AuthSettingsSection from './components/AuthSettingsSection'
import { AuthUnsupportedMsg } from './components/AuthSettingsSection/AuthUnsupportedMsg'
import { CategoryHeader } from './components/CategoryHeader'
import { useAdminFormSettings } from './queries'

export const SettingsAuthPage = (): JSX.Element => {
  const { data: settings, isLoading } = useAdminFormSettings()

  // Form auth is unsupported in MRF; show message.
  if (
    !isLoading &&
    settings?.responseMode === FormResponseMode.Multirespondent
  ) {
    return <AuthUnsupportedMsg />
  }

  return (
    <>
      <CategoryHeader>Singpass</CategoryHeader>
      <AuthSettingsSection />
    </>
  )
}
