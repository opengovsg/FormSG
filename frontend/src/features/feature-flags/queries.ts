import { useQuery, UseQueryResult } from 'react-query'

import { getFeatureFlagsEnabled } from '~services/FeatureFlagService'

export const featureFlagsKeys = {
  base: ['feature-flags'] as const,
}

export const useFeatureFlagsEnabled = (): UseQueryResult<Set<string>> => {
  return useQuery(featureFlagsKeys.base, () => getFeatureFlagsEnabled())
}
