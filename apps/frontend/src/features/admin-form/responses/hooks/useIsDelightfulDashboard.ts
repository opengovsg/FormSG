import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

import { RESULTS_DASHBOARD_VERSION_KEY } from '~constants/localStorage'
import { useLocalStorage } from '~hooks/useLocalStorage'

export type ResultsDashboardVersion = 'v1' | 'v2'

export const useResultsDashboardVersion = () =>
  useLocalStorage<ResultsDashboardVersion>(RESULTS_DASHBOARD_VERSION_KEY, 'v2')

export const useIsDelightfulDashboard = (): boolean => {
  const isEnabled = useFeatureIsOn(featureFlags.delightfulDashboard)
  const [version] = useResultsDashboardVersion()
  return isEnabled && version !== 'v1'
}
