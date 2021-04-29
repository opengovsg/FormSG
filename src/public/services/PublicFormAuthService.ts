import axios from 'axios'

import {
  PublicFormAuthRedirectDto,
  PublicFormAuthValidateEsrvcIdDto,
} from '../../types/api'

// Exported for testing
export const PUBLIC_FORMS_ENDPOINT = '/api/v3/forms'

export const createRedirectURL = (
  formId: string,
  isPersistentLogin = false,
): Promise<PublicFormAuthRedirectDto> => {
  return axios
    .get<PublicFormAuthRedirectDto>(
      `${PUBLIC_FORMS_ENDPOINT}/${formId}/auth/redirect`,
      {
        params: { isPersistentLogin },
      },
    )
    .then(({ data }) => data)
}

export const validateEsrvcId = (
  formId: string,
): Promise<PublicFormAuthValidateEsrvcIdDto> => {
  return axios
    .get<PublicFormAuthValidateEsrvcIdDto>(
      `${PUBLIC_FORMS_ENDPOINT}/${formId}/auth/validate`,
    )
    .then(({ data }) => data)
}
