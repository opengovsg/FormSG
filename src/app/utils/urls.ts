import { Environment } from '../../types'
import config from '../config/config'

export const resolveRedirectionUrl = (rootUrl: string) => {
  // For local dev, we need to specify the frontend app URL as this is different from the backend's app URL
  const hostname =
    process.env.NODE_ENV === Environment.Dev ? `${config.app.feAppUrl}` : ``

  const resolvedUrl = `${hostname}${rootUrl}`
  return resolvedUrl
}
