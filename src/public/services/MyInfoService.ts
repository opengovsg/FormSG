import axios from 'axios'

// Exported for testing
export const VALIDATE_ESRVCID_ENDPOINT = '/myinfo/validate'

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
