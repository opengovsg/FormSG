import axios from 'axios'

import {
  FormAuthType,
  PublicFormAuthLogoutDto,
  PublicFormAuthRedirectDto,
  PublicFormAuthValidateEsrvcIdDto,
} from '../../../shared/types/form'

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

export const logoutOfSpcpSession = (
  authType: FormAuthType,
): Promise<PublicFormAuthLogoutDto> => {
  return axios
    .get<PublicFormAuthLogoutDto>(
      `${PUBLIC_FORMS_ENDPOINT}/auth/${authType}/logout`,
    )
    .then(({ data }) => data)
}
