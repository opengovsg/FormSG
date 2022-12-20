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

import { othersInputName } from './PublicFeedbackModal'

export const getClientEnvVars = async (): Promise<ClientEnvVars> => {
  return ApiService.get<ClientEnvVars>('/client/env').then(({ data }) => data)
}

// TODO #4279: Remove after React rollout is complete
const createFeedbackResponsesArray = (
  feedbackFormFieldsStructure: string[],
  formInputs: AdminFeedbackFormDto | PublicFeedbackFormDto,
  feedbackForm: PublicFormViewDto,
) => {
  return feedbackFormFieldsStructure.map((question, i) => {
    const { _id, fieldType } = feedbackForm.form.form_fields[i]
    if (fieldType === BasicField.Checkbox) {
      const answerArray: string | string[] = formInputs[question] ?? []
      if (formInputs[othersInputName] && Array.isArray(answerArray)) {
        if (formInputs[question] === '[""]') {
          // Remove case where non-Others checkbox is selected
          answerArray.pop()
        }
        // remove '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!' from array
        answerArray.pop()
        answerArray.push(`Others: ${formInputs[othersInputName]}`)
      }
      return {
        _id,
        question,
        answerArray,
        fieldType,
      }
    }
    const answer: string | string[] = formInputs[question] ?? ''
    return {
      _id,
      question,
      answer,
      fieldType,
    }
  })
}

const createSwitchFeedbackSubmissionFormData = (
  feedbackFormFieldsStructure: string[],
  formInputs: AdminFeedbackFormDto | PublicFeedbackFormDto,
  feedbackForm: PublicFormViewDto,
) => {
  const responses = createFeedbackResponsesArray(
    feedbackFormFieldsStructure,
    formInputs,
    feedbackForm,
  )
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
  feedbackForm: PublicFormViewDto
}): Promise<SuccessMessageDto | ErrorDto> => {
  const isAdmin = Object.keys(formInputs).includes('rating')

  const formFields = [
    'url',
    'feedback',
    'email',
    'rumSessionId',
    'attachmentType',
    'userAgent',
    'responseMode',
    'authType',
  ]
  if (isAdmin) formFields.push('rating')

  const formData = createSwitchFeedbackSubmissionFormData(
    formFields,
    formInputs,
    feedbackForm,
  )

  return ApiService.post<SuccessMessageDto>(
    `${PUBLIC_FORMS_ENDPOINT}/submissions/email/switchenvfeedback`,
    formData,
    {
      params: {
        captchaResponse: 'null',
        view: isAdmin ? 'admin' : undefined,
      },
    },
  ).then(({ data }) => data)
}

/**
 * Gets public view of the public switch environment feedback form, along with any
 * identify information obtained from Singpass/Corppass/MyInfo.
 * @returns Public view of form, with additional identify information
 */
export const getFeedbackFormView = async (
  isAdmin?: boolean,
): Promise<PublicFormViewDto> => {
  return ApiService.get<PublicFormViewDto>(
    `${PUBLIC_FORMS_ENDPOINT}/switchenvfeedback`,
    {
      params: {
        view: isAdmin ? 'admin' : undefined,
      },
    },
  )
    .then(({ data }) => data)
    .then(transformAllIsoStringsToDate)
}
