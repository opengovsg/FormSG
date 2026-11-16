import { useParams } from 'react-router-dom'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

import { RESULTS_DASHBOARD_VERSION_KEY_PREFIX } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'

export type ResultsDashboardVersion = 'v1' | 'v2'

export const useResultsDashboardVersion = () => {
  const { formId } = useParams()
  return useLocalStorage<ResultsDashboardVersion>(
    formId ? `${RESULTS_DASHBOARD_VERSION_KEY_PREFIX}${formId}` : null,
    'v2',
  )
}

export const useIsDelightfulDashboard = (): boolean => {
  const isEnabled = useFeatureIsOn(featureFlags.delightfulDashboard)
  const [version] = useResultsDashboardVersion()
  return isEnabled && version !== 'v1'
}
