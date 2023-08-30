import { GrowthBook } from '@growthbook/growthbook-react'

import { GROWTHBOOK_API_HOST_PATH } from '~constants/links'

export const createGrowthbookInstance = (
  clientKey: string,
  formsgSdkMode?: 'staging' | 'production' | 'development' | 'test',
) => {
  const isDev = process.env.NODE_ENV === 'development'

  return new GrowthBook({
    apiHost: `${
      isDev
        ? 'https://proxy-growthbook-stg.formsg.workers.dev'
        : process.env.REACT_APP_URL
    }${GROWTHBOOK_API_HOST_PATH}`,
    clientKey: clientKey,
    // Enable easier debugging during development
    enableDevMode: isDev,
  })
}
