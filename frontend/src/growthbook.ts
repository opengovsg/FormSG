import { GrowthBook } from '@growthbook/growthbook-react'

import { GROWTHBOOK_DEV_PROXY } from '~constants/links'
import { GROWTHBOOK_API_HOST_PATH } from '~constants/routes'

export const createGrowthbookInstance = (clientKey: string) => {
  const isDev = process.env.NODE_ENV === 'development'

  return new GrowthBook({
    apiHost: `${
      isDev ? GROWTHBOOK_DEV_PROXY : process.env.REACT_APP_URL
    }${GROWTHBOOK_API_HOST_PATH}`,
    clientKey: clientKey,
    // Enable easier debugging during development
    enableDevMode: isDev,
  })
}
