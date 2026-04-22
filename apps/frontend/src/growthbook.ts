import { GrowthBook } from '@growthbook/growthbook-react'

import { GROWTHBOOK_DEV_PROXY } from 'formsg-shared/constants/links'
import { GROWTHBOOK_API_HOST_PATH } from 'formsg-shared/constants/routes'

import { env } from '~/env'

export const createGrowthbookInstance = (clientKey: string) => {
  const isDev = import.meta.env.MODE === 'development'

  const apiHost = `${
    isDev ? GROWTHBOOK_DEV_PROXY : env.appUrl
  }${GROWTHBOOK_API_HOST_PATH}`

  return new GrowthBook({
    apiHost,
    clientKey: clientKey,
    // Enable easier debugging during development
    enableDevMode: isDev,
  })
}
