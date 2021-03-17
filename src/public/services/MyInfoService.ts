import axios from 'axios'

type RedirectURLResult = { redirectURL: string }

// Exported for testing
export const REDIRECT_URL_ENDPOINT = '/myinfo/redirect'
export const VALIDATE_ESRVCID_ENDPOINT = '/myinfo/validate'

export const createRedirectURL = (
  formId: string,
): Promise<RedirectURLResult> => {
  return axios
    .get<RedirectURLResult>(REDIRECT_URL_ENDPOINT, {
      params: { formId },
    })
    .then(({ data }) => data)
}

type LoginPageValidationResult =
  | { isValid: true }
  | { isValid: false; errorCode: string | null }

export const validateESrvcId = (
  formId: string,
): Promise<LoginPageValidationResult> => {
  return axios
    .get<LoginPageValidationResult>(VALIDATE_ESRVCID_ENDPOINT, {
      params: { formId },
    })
    .then(({ data }) => data)
}
