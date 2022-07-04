import axios from 'axios'

import {
  FormAuthType,
  PublicFormAuthLogoutDto,
  PublicFormAuthRedirectDto,
} from '../../../shared/types'

// Exported for testing
export const PUBLIC_FORMS_ENDPOINT = '/api/v3/forms'

export const createRedirectURL = (
  formId: string,
  isPersistentLogin = false,
  encodedQuery?: string,
): Promise<PublicFormAuthRedirectDto> => {
  return axios
    .get<PublicFormAuthRedirectDto>(
      `${PUBLIC_FORMS_ENDPOINT}/${formId}/auth/redirect`,
      {
        params: { encodedQuery, isPersistentLogin },
      },
    )
    .then(({ data }) => data)
}

export const logoutOfSpcpSession = (
  authType: FormAuthType,
): Promise<PublicFormAuthLogoutDto> => {
  return axios
    .get<PublicFormAuthLogoutDto>(
      `${PUBLIC_FORMS_ENDPOINT}/auth/${authType}/logout`,
    )
    .then(({ data }) => data)
}
