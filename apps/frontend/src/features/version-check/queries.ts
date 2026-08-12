import { useQuery } from 'react-query'

import { getClientEnvVars } from '~features/env/EnvService'

const versionCheckKeys = {
  base: ['version-check'] as const,
}

/**
 * How often to poll the backend for its deployed version. Deploys are
 * infrequent relative to this, and the env endpoint is a cheap static
 * payload, so a modest interval keeps detection latency low without
 * meaningful load.
 */
export const VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Version string baked into the frontend bundle at build time
 * (see Dockerfile.production and vite.config.ts). Empty in local dev,
 * in which case version comparisons are skipped entirely.
 */
export const getBundleVersion = (): string =>
  import.meta.env.VITE_APP_VERSION ?? ''

/**
 * Polls the backend's env endpoint for the currently deployed backend
 * version. Also refetches on window focus so long-lived background tabs
 * catch up as soon as the user returns.
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
