import { SuccessMessageDto } from '~shared/types'
import { FormFieldDto } from '~shared/types/field'
import {
  PublicFormAuthLogoutDto,
  PublicFormAuthRedirectDto,
  SubmitFormFeedbackBodyDto,
} from '~shared/types/form'
import {
  FormAuthType,
  FormDto,
  PublicFormViewDto,
} from '~shared/types/form/form'
import { SubmissionResponseDto } from '~shared/types/submission'

import { transformAllIsoStringsToDate } from '~utils/date'
import { ApiService } from '~services/ApiService'
import { FormFieldValues } from '~templates/Field'

import {
  createEmailSubmissionFormData,
  createEncryptedSubmissionData,
} from './utils/createSubmission'
import { filterHiddenInputs } from './utils/filterHiddenInputs'

export const PUBLIC_FORMS_ENDPOINT = '/forms'

/**
 * Gets public view of form, along with any
 * identify information obtained from Singpass/Corppass/MyInfo.
 * @param formId FormId of form in question
 * @returns Public view of form, with additional identify information
 */
export const getPublicFormView = async (
  formId: string,
): Promise<PublicFormViewDto> => {
  return ApiService.get<PublicFormViewDto>(`${PUBLIC_FORMS_ENDPOINT}/${formId}`)
    .then(({ data }) => data)
    .then(transformAllIsoStringsToDate)
}

/**
 * Gets the redirect url for public form login
 * @param formId form id of form to log in.
 * @param isPersistentLogin whether login is persistent; affects cookie lifetime.
 * @returns redirect url for public form login
 */
export const getPublicFormAuthRedirectUrl = async (
  formId: string,
  isPersistentLogin = false,
  encodedQuery?: string,
): Promise<PublicFormAuthRedirectDto['redirectURL']> => {
  return ApiService.get<PublicFormAuthRedirectDto>(
    `${PUBLIC_FORMS_ENDPOINT}/${formId}/auth/redirect`,
    { params: { encodedQuery, isPersistentLogin } },
  ).then(({ data }) => data.redirectURL)
}

/**
 * Logs out of current public form session
 * @param authType authType of form to log out.
 * @returns Success message
 */
export const logoutPublicForm = async (
  authType: Exclude<FormAuthType, FormAuthType.NIL>,
): Promise<PublicFormAuthLogoutDto> => {
  return ApiService.get<PublicFormAuthLogoutDto>(
    `${PUBLIC_FORMS_ENDPOINT}/auth/${authType}/logout`,
  ).then(({ data }) => data)
}

export type SubmitEmailFormArgs = {
  formId: string
  captchaResponse?: string | null
  formFields: FormFieldDto[]
  formLogics: FormDto['form_logics']
  formInputs: FormFieldValues
}

export type SubmitStorageFormArgs = SubmitEmailFormArgs & { publicKey: string }

export const submitEmailModeForm = async ({
  formFields,
  formLogics,
  formInputs,
  formId,
  captchaResponse = null,
}: SubmitEmailFormArgs): Promise<SubmissionResponseDto> => {
  const filteredInputs = filterHiddenInputs({
    formFields,
    formInputs,
    formLogics,
  })
  const formData = createEmailSubmissionFormData(formFields, filteredInputs)

  return ApiService.post<SubmissionResponseDto>(
    `${PUBLIC_FORMS_ENDPOINT}/${formId}/submissions/email`,
    formData,
    {
      params: {
        captchaResponse: String(captchaResponse),
      },
    },
  ).then(({ data }) => data)
}

export const submitStorageModeForm = async ({
  formFields,
  formLogics,
  formInputs,
  formId,
  publicKey,
  captchaResponse = null,
}: SubmitStorageFormArgs) => {
  const filteredInputs = filterHiddenInputs({
    formFields,
    formInputs,
    formLogics,
  })
  const submissionContent = await createEncryptedSubmissionData(
    formFields,
    filteredInputs,
    publicKey,
  )

  return ApiService.post<SubmissionResponseDto>(
    `${PUBLIC_FORMS_ENDPOINT}/${formId}/submissions/encrypt`,
    submissionContent,
    {
      params: {
        captchaResponse: String(captchaResponse),
      },
    },
  ).then(({ data }) => data)
}

/**
 * Post feedback for a given form.
 * @param formId the id of the form to post feedback for
 * @param submissionId the id of the form submission to post feedback for
 * @param feedbackToPost object containing the feedback
 * @returns success message
 */
export const submitFormFeedback = async (
  formId: string,
  submissionId: string,
  feedbackToPost: SubmitFormFeedbackBodyDto,
): Promise<SuccessMessageDto> => {
  return ApiService.post<SuccessMessageDto>(
    `${PUBLIC_FORMS_ENDPOINT}/${formId}/submissions/${submissionId}/feedback`,
    feedbackToPost,
  ).then(({ data }) => data)
}
