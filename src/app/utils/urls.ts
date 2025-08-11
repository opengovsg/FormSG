import { Environment } from '../../types'
import config from '../config/config'

/**
 * Resolves the application URL for a given root URL.
 * This is typically used to construct URLs for redirection or API endpoints
 * for FormFE.
 *
 * On localhost, it resolves to localhost with the frontend app URL.
 * - i.e. localhost:5173/some/url
 *
 * On non-localhost, it resolves to a root URL.
 * - i.e. /some/url
 * @see resolveAppUrl for constructing URLs for external applications.
 * @param rootUrl The root URL to resolve.
 * @returns The resolved application URL.
 */
export const resolveRedirectionUrl = (rootUrl: string) => {
  // For local dev, we need to specify the frontend app URL as this is different from the backend's app URL
  const hostname =
    process.env.NODE_ENV === Environment.Dev ? `${config.app.feAppUrl}` : ``

  const resolvedUrl = `${hostname}${rootUrl}`
  return resolvedUrl
}

/**
 * Resolves the application URL for a given root URL.
 * This is typically used to construct URLs for redirection or API endpoints
 * for external applications.
 *
 * On localhost, it resolves to localhost with the frontend app URL.
 * - i.e. localhost:5173/some/url
 *
 * On non-localhost, it resolves to a full URL.
 * - i.e. https://example.com/some/url
 * @see resolveRedirectionUrl for constructing URLs for FormFE.
 * @param rootUrl The root URL to resolve.
 * @returns The resolved application URL.
 */
export const resolveAppUrl = (rootUrl: string) => {
  // For local dev, we need to specify the frontend app URL as this is different from the backend's app URL
  const hostname =
    process.env.NODE_ENV === Environment.Dev
      ? `${config.app.feAppUrl}`
      : `${config.app.appUrl}`

  const resolvedUrl = `${hostname}${rootUrl}`
  return resolvedUrl
}
