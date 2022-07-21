import { UiCookieValues } from '~shared/types'

import { PUBLIC_FORMS_ENDPOINT } from '~features/public-form/PublicFormService'

import { ApiService } from './ApiService'

const ENV_ENDPOINT = '/environment'
const ADMIN_ENDPOINT = '/admin'
export const publicChooseEnvironment = async (
  ui: UiCookieValues,
): Promise<UiCookieValues> => {
  return ApiService.get(`${PUBLIC_FORMS_ENDPOINT}/${ENV_ENDPOINT}/${ui}`).then(
    ({ data }) => data,
  )
}

export const adminChooseEnvironment = async (
  ui: UiCookieValues,
): Promise<UiCookieValues> => {
  return ApiService.get(`${ADMIN_ENDPOINT}/${ENV_ENDPOINT}/${ui}`).then(
    ({ data }) => data,
  )
}
