// TODO #4279: Remove after React rollout is complete
import { UiCookieValues } from '~shared/types'

import { PUBLIC_FORMS_ENDPOINT } from '~features/public-form/PublicFormService'

import { ApiService } from './ApiService'

const ENV_ENDPOINT = '/environment'
const ADMIN_ENDPOINT = '/admin'

export const publicChooseEnvironment = async (): Promise<UiCookieValues> => {
  return ApiService.get(
    `${PUBLIC_FORMS_ENDPOINT}/${ENV_ENDPOINT}/${UiCookieValues.Angular}`,
  ).then(({ data }) => data)
}

export const adminChooseEnvironment = async (): Promise<UiCookieValues> => {
  return ApiService.get(
    `${ADMIN_ENDPOINT}/${ENV_ENDPOINT}/${UiCookieValues.Angular}`,
  ).then(({ data }) => data)
}
