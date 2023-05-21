import { useQuery, UseQueryResult } from 'react-query'

import { getEnabledFeatureFlags } from '~services/FeatureFlagService'

export const featureFlagsKeys = {
  base: ['feature-flags'] as const,
}

// TODO: Add local caching system with interval based refresh
// Refer to https://github.com/opengovsg/FormSG/pull/6286#discussion_r1190529370
export const useFeatureFlags = (): UseQueryResult<Set<string>> => {
  return useQuery(featureFlagsKeys.base, () => getEnabledFeatureFlags())
}
