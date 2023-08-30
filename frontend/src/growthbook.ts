import { GrowthBook } from '@growthbook/growthbook-react'

import { GROWTHBOOK_API_HOST_PATH } from '~constants/links'

export const createGrowthbookInstance = (
  clientKey: string,
  formsgSdkMode?: 'staging' | 'production' | 'development' | 'test',
) => {
  return new GrowthBook({
    apiHost: `${
      process.env.REACT_APP_URL ??
      'https://proxy-growthbook-stg.formsg.workers.dev'
    }${GROWTHBOOK_API_HOST_PATH}`,
    clientKey: clientKey,
    // Enable easier debugging during development
    enableDevMode: formsgSdkMode === 'development',
  })
}
