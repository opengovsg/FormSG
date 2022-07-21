import { UiCookieValues } from '~shared/types'

import { ApiService } from './ApiService'

const ENV_ENDPOINT = '/environment'

export const publicChooseEnvironment = async (
  ui: UiCookieValues,
): Promise<UiCookieValues> => {
  return ApiService.get(`${ENV_ENDPOINT}/${ui}`).then(({ data }) => data)
}
