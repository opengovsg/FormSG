import { GrowthBook } from '@growthbook/growthbook-react'

import { GROWTHBOOK_API_HOST } from '~constants/links'

export const createGrowthbookInstance = (
  clientKey: string,
  formsgSdkMode?: 'staging' | 'production' | 'development' | 'test',
) => {
  return new GrowthBook({
    apiHost: GROWTHBOOK_API_HOST,
    clientKey: clientKey,
    // Enable easier debugging during development
    enableDevMode: formsgSdkMode === 'development',
  })
}
