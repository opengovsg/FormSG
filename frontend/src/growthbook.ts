import { GrowthBook } from '@growthbook/growthbook-react'

import { GROWTHBOOK_DEV_PROXY } from '~shared/constants/links'
import { GROWTHBOOK_API_HOST_PATH } from '~shared/constants/routes'

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
