import axios from 'axios'

import { UiCookieValues } from 'src/app/modules/react-migration/react-migration.controller'

// endpoint exported for testing
export const ADMIN_FORM_ENDPOINT = '/api/v3/admin/forms'

/**
 * Switch environments by changing the adminCookieName cookie
 * @returns the chosen environment: 'react' or 'angular'.
 */
export const adminChooseEnvironment = async (
  env: UiCookieValues,
): Promise<UiCookieValues> => {
  return axios
    .get<UiCookieValues>(`${ADMIN_FORM_ENDPOINT}/environment/${env}`)
    .then(({ data }) => data)
}
