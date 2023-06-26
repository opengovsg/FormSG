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

// Retrieves a feature flag and returns the default value
// if an error is encountered or if the flag does not exist
export const useFeatureFlagWithDefaults = (
  flagName: string,
  defaultValue: boolean,
): boolean => {
  const flags = useQuery(featureFlagsKeys.base, () => getEnabledFeatureFlags())
  console.log('flags', flags)
  if (flags.isError || !flags.data?.has(flagName)) {
    console.log('returning default')
    console.log('error', flags.isError)
    console.log('data', !flags.data?.has(flagName))
    return defaultValue
  }
  console.log('returning actual', flags.data.has(flagName))
  return flags.data.has(flagName)
}
