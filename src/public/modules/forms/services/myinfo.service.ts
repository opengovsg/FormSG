import axios from 'axios'

type RedirectURLResult = { redirectURL: string }

export const createRedirectURL = (
  formId: string,
): Promise<RedirectURLResult> => {
  return axios
    .get<RedirectURLResult>('/myinfo/redirect', {
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
    .get<LoginPageValidationResult>('/myinfo/validate', {
      params: { formId },
    })
    .then(({ data }) => data)
}
