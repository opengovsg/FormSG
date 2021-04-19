import axios from 'axios'

import { RedirectUrlDto } from 'src/types/api/auth'

// Exported for testing
export const PUBLIC_FORMS_ENDPOINT = '/api/v3/forms'
export const REDIRECT_URL_ENDPOINT = '/auth/redirect'
export const VALIDATE_ESRVCID_ENDPOINT = '/auth/validate'

export const createRedirectURL = (
  formId: string,
  isPersistentLogin: boolean,
): Promise<RedirectUrlDto> => {
  return axios
    .get<RedirectUrlDto>(
      `${PUBLIC_FORMS_ENDPOINT}/${formId}/${REDIRECT_URL_ENDPOINT}`,
      {
        params: { isPersistentLogin },
      },
    )
    .then(({ data }) => data)
}
