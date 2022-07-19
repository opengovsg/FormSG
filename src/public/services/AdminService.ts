import axios from 'axios'
import { UiCookieValues } from 'shared/types'

// endpoint exported for testing
export const ADMIN_ENDPOINT = '/api/v3/admin'

/**
 * Switch environments by changing the adminCookieName cookie
 * @returns the chosen environment: 'react' or 'angular'.
 */
export const adminChooseEnvironment = async (
  ui: UiCookieValues,
): Promise<UiCookieValues> => {
  return axios
    .get<UiCookieValues>(`${ADMIN_ENDPOINT}/environment/${ui}`)
    .then(({ data }) => data)
}
