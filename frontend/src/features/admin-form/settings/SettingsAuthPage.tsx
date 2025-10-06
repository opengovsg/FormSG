import { FormResponseMode } from '~shared/types'

import { useUser } from '~features/user/queries'

import AuthSettingsSection from './components/AuthSettingsSection'
import { AuthUnsupportedMsg } from './components/AuthSettingsSection/AuthUnsupportedMsg'
import { CategoryHeader } from './components/CategoryHeader'
import { useAdminFormSettings } from './queries'

export const SettingsAuthPage = (): JSX.Element => {
  const { data: settings, isLoading } = useAdminFormSettings()
  const { user } = useUser()

  // TODO: FRM-2151 remove when Singpass MRF is out of beta
  if (
    !isLoading &&
    settings?.responseMode === FormResponseMode.Multirespondent &&
    !user?.betaFlags?.singpassMrf
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
