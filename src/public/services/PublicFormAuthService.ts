import axios from 'axios'

import { RedirectUrlDto } from '../../types/api'

// Exported for testing
export const PUBLIC_FORMS_ENDPOINT = '/api/v3/forms'

export const createRedirectURL = (
  formId: string,
  isPersistentLogin = false,
): Promise<RedirectUrlDto> => {
  return axios
    .get<RedirectUrlDto>(`${PUBLIC_FORMS_ENDPOINT}/${formId}/auth/redirect`, {
      params: { isPersistentLogin },
    })
    .then(({ data }) => data)
}
