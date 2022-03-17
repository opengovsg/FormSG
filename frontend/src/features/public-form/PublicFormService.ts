import { FormFieldDto } from '~shared/types/field'
import {
  PublicFormAuthLogoutDto,
  PublicFormAuthRedirectDto,
} from '~shared/types/form'
import { FormAuthType, PublicFormViewDto } from '~shared/types/form/form'
import { SubmissionResponseDto } from '~shared/types/submission'

import { transformAllIsoStringsToDate } from '~utils/date'
import { ApiService } from '~services/ApiService'

import {
  createEmailSubmissionFormData,
  createEncryptedSubmissionData,
} from './utils/createSubmission'

const PUBLIC_FORMS_ENDPOINT = '/forms'

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
): Promise<PublicFormAuthRedirectDto['redirectURL']> => {
  return ApiService.get<PublicFormAuthRedirectDto>(
    `${PUBLIC_FORMS_ENDPOINT}/${formId}/auth/redirect`,
    { params: { isPersistentLogin } },
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

export type SubmitPublicFormArgs = {
  formId: string
  captchaResponse?: string | null
  formFields: FormFieldDto[]
  formInputs: Record<string, unknown>
}

export const submitEmailModeForm = async ({
  formFields,
  formInputs,
  formId,
  captchaResponse = null,
}: SubmitPublicFormArgs): Promise<SubmissionResponseDto> => {
  const formData = createEmailSubmissionFormData(formFields, formInputs)

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

export const submitEncryptModeForm = async ({
  formFields,
  formInputs,
  captchaResponse,
  formId,
  publicKey,
}: SubmitPublicFormArgs & { publicKey: string }) => {
  const submissionContent = createEncryptedSubmissionData(
    formFields,
    formInputs,
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
