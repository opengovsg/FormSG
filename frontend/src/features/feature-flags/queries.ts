import { useQuery, UseQueryResult } from 'react-query'

import { getEnabledFeatureFlags } from '~features/feature-flags/FeatureFlagService'

export const featureFlagsKeys = {
  base: ['feature-flags'] as const,
}

// TODO: Add local caching system with interval based refresh
// Refer to https://github.com/opengovsg/FormSG/pull/6286#discussion_r1190529370
export const useFeatureFlags = (): UseQueryResult<Set<string>> => {
  return useQuery(featureFlagsKeys.base, () => getEnabledFeatureFlags())
}

// Retrieves a feature flag and returns the default value
// if an error is encountered or if the flag does not exist
// Definition:
// useIsFeatureEnabled(flagName: string,  defaultValue: boolean): boolean
// Usage:
// const enableTurnstile = useIsFeatureEnabled(
//     featureFlags.turnstile,
//     false,
//   )
export const useIsFeatureEnabled = (
  flagName: string,
  defaultValue: boolean,
): boolean => {
  const flags = useQuery(featureFlagsKeys.base, () => getEnabledFeatureFlags())
  if (flags.isError || !flags.data?.has(flagName)) {
    return defaultValue
  }
  return flags.data.has(flagName)
}
