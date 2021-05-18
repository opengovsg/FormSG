import axios from 'axios'

import {
  EmailSubmissionDto,
  EncryptSubmissionDto,
  SubmissionResponseDto,
} from '../../types/api'
import { createEmailSubmissionFormData } from '../utils/submission'

const PUBLIC_FORMS_ENDPOINT = '/api/v3/forms'

/**
 * Submits the email mode form's FormData created from given submissionContent
 * @param formId id of form to submit submission for
 * @param content content of submission
 * @param attachments any attachments included in submission
 * @param captchaResponse string if captcha to be included, defaults to null
 *
 * @returns SubmissionResponseDto if successful, else SubmissionErrorDto on error
 */
export const submitEmailModeFormSubmission = async ({
  formId,
  content,
  attachments,
  captchaResponse = null,
}: {
  formId: string
  content: EmailSubmissionDto
  attachments?: Record<string, File>
  captchaResponse?: string | null
}): Promise<SubmissionResponseDto> => {
  const formData = createEmailSubmissionFormData({
    content,
    attachments,
  })

  return axios
    .post<SubmissionResponseDto>(
      `${PUBLIC_FORMS_ENDPOINT}/${formId}/submissions/email`,
      formData,
      {
        params: {
          captchaResponse: String(captchaResponse),
        },
      },
    )
    .then(({ data }) => data)
}

/**
 * Submits the given storage mode form's submission object
 * @param formId id of form to submit submission for
 * @param content the storage mode submission object to submit
 * @param captchaResponse string if captcha to be included, defaults to null
 *
 * @returns SubmissionResponseDto if successful, else SubmissionErrorDto on error
 */
export const submitStorageModeFormSubmission = async ({
  formId,
  content,
  captchaResponse = null,
}: {
  formId: string
  content: EncryptSubmissionDto
  captchaResponse?: string | null
}): Promise<SubmissionResponseDto> => {
  return axios
    .post<SubmissionResponseDto>(
      `${PUBLIC_FORMS_ENDPOINT}/${formId}/submissions/encrypt`,
      content,
      {
        params: {
          captchaResponse: String(captchaResponse),
        },
      },
    )
    .then(({ data }) => data)
}
