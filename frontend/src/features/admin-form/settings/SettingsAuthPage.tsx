import { useMemo } from 'react'

import { FormResponseMode } from '~shared/types'

import { useUser } from '~features/user/queries'

import AuthSettingsSection from './components/AuthSettingsSection'
import { AuthUnsupportedMsg } from './components/AuthSettingsSection/AuthUnsupportedMsg'
import { CategoryHeader } from './components/CategoryHeader'
import { useAdminFormSettings } from './queries'

export const SettingsAuthPage = (): JSX.Element => {
  const { data: settings, isLoading } = useAdminFormSettings()
  const { user } = useUser()

  const showAuthSection = useMemo(() => {
    if (isLoading || !settings) return false
    // TODO: FRM-2151 remove when Singpass MRF is out of beta
    if (settings.responseMode === FormResponseMode.Multirespondent) {
      return user?.betaFlags?.singpassMrf
    }
    return true
  }, [isLoading, settings, user?.betaFlags?.singpassMrf])

  if (!showAuthSection) {
    return <AuthUnsupportedMsg />
  }

  return (
    <>
      <CategoryHeader>Singpass</CategoryHeader>
      <AuthSettingsSection />
    </>
  )
}
