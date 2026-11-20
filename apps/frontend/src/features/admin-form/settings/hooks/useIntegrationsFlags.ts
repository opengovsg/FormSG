import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

// TODO (settings-integrations, settings-integrations-json): remove when GA
export const useIntegrationsFlags = () => {
  const isPlumberInSettings = useFeatureIsOn(featureFlags.settingsIntegrations)
  const isEmailJsonToggleOn = useFeatureIsOn(
    featureFlags.settingsIntegrationsJson,
  )
  return {
    isPlumberInSettings,
    isEmailJsonToggleOn,
    isIntegrationsTab: isPlumberInSettings || isEmailJsonToggleOn,
  }
}
