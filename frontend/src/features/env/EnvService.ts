import {
  ErrorDto,
  PublicFormViewDto,
  switchEnvFeedbackFormBodyDto,
} from '~shared/types'
import { ClientEnvVars, SuccessMessageDto } from '~shared/types/core'

import { transformAllIsoStringsToDate } from '~utils/date'
import { ApiService } from '~services/ApiService'

import { PUBLIC_FORMS_ENDPOINT } from '~features/public-form/PublicFormService'

export const getClientEnvVars = async (): Promise<ClientEnvVars> => {
  return ApiService.get<ClientEnvVars>('/client/env').then(({ data }) => data)
}

// TODO #4279: Remove after React rollout is complete
const createFeedbackResponsesArray = (
  formInputs: switchEnvFeedbackFormBodyDto,
  feedbackForm: PublicFormViewDto,
) => {
  const responses = []
  for (const [key, value] of Object.entries(formInputs)) {
    const fieldIndex = key === 'url' ? 0 : key === 'feedback' ? 1 : 2
    const { _id, fieldType } = feedbackForm?.form.form_fields[fieldIndex] ?? {}
    const entry = {
      _id,
      question: key,
      answer: value ?? '',
      fieldType,
    }
    responses.push(entry)
  }
  return responses
}

const createSwitchFeedbackSubmissionFormData = (
  formInputs: switchEnvFeedbackFormBodyDto,
  feedbackForm: PublicFormViewDto,
) => {
  const responses = createFeedbackResponsesArray(formInputs, feedbackForm)
  // convert content to FormData object
  const formData = new FormData()
  formData.append('body', JSON.stringify({ responses }))

  return formData
}

/**
 * Post feedback for the switch environment feedback form
 * @param formInputs object containing the feedback
 * @returns success message
 */
export const submitSwitchEnvFormFeedback = async ({
  formInputs,
  feedbackForm,
}: {
  formInputs: switchEnvFeedbackFormBodyDto
  feedbackForm: PublicFormViewDto | undefined
}): Promise<SuccessMessageDto | ErrorDto> => {
  if (!feedbackForm) return new Error('feedback form not provided')
  const formData = createSwitchFeedbackSubmissionFormData(
    formInputs,
    feedbackForm,
  )
  return ApiService.post<SuccessMessageDto>(
    `${PUBLIC_FORMS_ENDPOINT}/submissions/email/switchenvfeedback?captchaResponse=null`,
    formData,
  ).then(({ data }) => data)
}

/**
 * Gets public view of the switch environment feedback form, along with any
 * identify information obtained from Singpass/Corppass/MyInfo.
 * @returns Public view of form, with additional identify information
 */
export const getSwitchEnvFormView = async (): Promise<PublicFormViewDto> => {
  return ApiService.get<PublicFormViewDto>(
    `${PUBLIC_FORMS_ENDPOINT}/switchenvfeedback`,
  )
    .then(({ data }) => data)
    .then(transformAllIsoStringsToDate)
}
