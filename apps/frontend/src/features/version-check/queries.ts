import { useQuery } from 'react-query'

import { getClientEnvVars } from '~features/env/EnvService'

const versionCheckKeys = {
  base: ['version-check'] as const,
}

export const VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000

/** Version string baked into the frontend bundle at build time. Empty in local dev. */
export const getBundleVersion = (): string =>
  import.meta.env.VITE_APP_VERSION ?? ''

/**
 * Polls the backend for its deployed version, and refetches on window focus.
 * @returns the deployed backend version, or `undefined` while loading or if
 * the backend predates the `appVersion` field.
 */
export const useServerAppVersion = (): string | undefined => {
  const { data } = useQuery(versionCheckKeys.base, getClientEnvVars, {
    refetchInterval: VERSION_CHECK_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  })
  return data?.appVersion
}
