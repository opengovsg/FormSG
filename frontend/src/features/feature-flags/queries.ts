import { useQuery, UseQueryResult } from 'react-query'

import { getEnabledFeatureFlags } from '~services/FeatureFlagService'

export const featureFlagsKeys = {
  base: ['feature-flags'] as const,
}

export const useFeatureFlags = (): UseQueryResult<Set<string>> => {
  return useQuery(featureFlagsKeys.base, () => getEnabledFeatureFlags())
}
