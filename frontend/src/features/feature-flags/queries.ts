import { useQuery, UseQueryResult } from 'react-query'

import { getFeatureFlagEnabled } from '~services/FeatureFlagService'

export const featureFlagsKeys = {
  base: ['feature-flags'] as const,
}

export const useFeatureFlagEnabled = (
  flag: string,
): UseQueryResult<boolean> => {
  return useQuery(featureFlagsKeys.base, () => getFeatureFlagEnabled(flag))
}
