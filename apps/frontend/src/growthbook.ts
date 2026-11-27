import { GrowthBook } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { GROWTHBOOK_DEV_PROXY } from 'formsg-shared/constants/links'
import { GROWTHBOOK_API_HOST_PATH } from 'formsg-shared/constants/routes'

import { env } from '~/env'

export const createGrowthbookInstance = (
  clientKey: string,
  apiHostOverride?: string,
) => {
  const isDev = import.meta.env.MODE === 'development'

  const apiHost = `${
    isDev ? GROWTHBOOK_DEV_PROXY : apiHostOverride || env.appUrl
  }${GROWTHBOOK_API_HOST_PATH}`

  const growthbook = new GrowthBook({
    apiHost,
    clientKey: clientKey,
    // Enable easier debugging during development
    enableDevMode: isDev,
  })
  // Explicit local preview only. Vite replaces DEV with false in production builds.
  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_ENABLE_STEP_LOGIN_PREVIEW === 'true'
  ) {
    growthbook.setForcedFeatures(
      new Map([
        [featureFlags.mrfStepLogin, true],
        [featureFlags.isNricFieldEnabled, true],
      ]),
    )
  }
  return growthbook
}
