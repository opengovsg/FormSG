import {
  AdminFeedbackFormDto,
  BasicField,
  ErrorDto,
  PublicFeedbackFormDto,
  PublicFormViewDto,
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
  formInputs: AdminFeedbackFormDto | PublicFeedbackFormDto,
  feedbackForm: PublicFormViewDto,
) => {
  // Public does not have rating, but admin does
  const feedbackFormFieldsStructure = [
    'url',
    'feedback',
    'email',
    'rumSessionId',
  ]
  if (Object.keys(formInputs).includes('rating')) {
    feedbackFormFieldsStructure.push('rating')
  }

  const responses: {
    _id: string
    question: string
    answer: string
    fieldType: BasicField
  }[] = feedbackFormFieldsStructure.map((question, i) => {
    const { _id, fieldType } = feedbackForm.form.form_fields[i]
    const answer: string = formInputs[question] ?? ''
    return {
      _id,
      question,
      answer,
      fieldType,
    }
  })

  return responses
}

const createSwitchFeedbackSubmissionFormData = (
  formInputs: AdminFeedbackFormDto | PublicFeedbackFormDto,
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
  formInputs: AdminFeedbackFormDto | PublicFeedbackFormDto
  feedbackForm?: PublicFormViewDto
}): Promise<SuccessMessageDto | ErrorDto> => {
  if (!feedbackForm) return new Error('Feedback form not provided')
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
 * Gets public view of the admin switch environment feedback form, along with any
 * identify information obtained from Singpass/Corppass/MyInfo.
 * @returns Public view of form, with additional identify information
 */
export const getAdminFeedbackFormView =
  async (): Promise<PublicFormViewDto> => {
    return ApiService.get<PublicFormViewDto>(
      `${PUBLIC_FORMS_ENDPOINT}/switchenvfeedback/admin`,
    )
      .then(({ data }) => data)
      .then(transformAllIsoStringsToDate)
  }

/**
 * Gets public view of the public switch environment feedback form, along with any
 * identify information obtained from Singpass/Corppass/MyInfo.
 * @returns Public view of form, with additional identify information
 */
export const getPublicFeedbackFormView =
  async (): Promise<PublicFormViewDto> => {
    return ApiService.get<PublicFormViewDto>(
      `${PUBLIC_FORMS_ENDPOINT}/switchenvfeedback`,
    )
      .then(({ data }) => data)
      .then(transformAllIsoStringsToDate)
  }
