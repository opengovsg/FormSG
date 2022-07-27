import { switchEnvFeedbackFormBodyDto } from '~shared/types'
import { ClientEnvVars, SuccessMessageDto } from '~shared/types/core'

import { ApiService } from '~services/ApiService'

import { PUBLIC_FORMS_ENDPOINT } from '~features/public-form/PublicFormService'

export const getClientEnvVars = async (): Promise<ClientEnvVars> => {
  return ApiService.get<ClientEnvVars>('/client/env').then(({ data }) => data)
}

// TODO #4279: Remove after React rollout is complete
// formId is different depending on the environment
// TODO: Change formId depending on which site it's pushed to
// prod: '62c3e0e417122f0012ec972e', staging: '62da5fc8bb546f00126ff457', staging-alt2: '62dfb373192e24001269171d'
const formId =
  process.env.NODE_ENV === 'production'
    ? '62da5fc8bb546f00126ff457'
    : '62da6a569ee8e90143b5da26'

const createFeedbackResponsesArray = (
  formInputs: switchEnvFeedbackFormBodyDto,
) => {
  const responses = []
  for (const [key, value] of Object.entries(formInputs)) {
    const entry = {
      _id:
        key === 'url'
          ? '62df452222274b0074f79b12'
          : key === 'feedback'
          ? '62da6a679ee8e90143b5da35'
          : '62da6a6f9ee8e90143b5da40',
      question: key,
      answer: value ?? '',
      fieldType:
        key === 'url' ? 'textfield' : key === 'feedback' ? 'textarea' : 'email',
    }
    responses.push(entry)
  }
  return responses
}

const createSwitchFeedbackSubmissionFormData = (
  formInputs: switchEnvFeedbackFormBodyDto,
) => {
  const responses = createFeedbackResponsesArray(formInputs)
  // convert content to FormData object
  const formData = new FormData()
  formData.append('body', JSON.stringify({ responses }))

  return formData
}

/**
 * Post feedback for environment switch form
 * @param formInputs object containing the feedback
 * @returns success message
 */
export const submitSwitchEnvFormFeedback = async ({
  formInputs,
}: {
  formInputs: switchEnvFeedbackFormBodyDto
}): Promise<SuccessMessageDto> => {
  const formData = createSwitchFeedbackSubmissionFormData(formInputs)
  return ApiService.post<SuccessMessageDto>(
    `${PUBLIC_FORMS_ENDPOINT}/${formId}/submissions/email?captchaResponse=null`,
    formData,
  ).then(({ data }) => data)
}
