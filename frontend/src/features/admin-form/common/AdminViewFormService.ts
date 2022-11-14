import { SubmissionResponseDto } from '~shared/types'
import {
  AdminFormDto,
  AdminFormViewDto,
  FormAuthType,
  FormPermissionsDto,
  PermissionsUpdateDto,
  PreviewFormViewDto,
  SmsCountsDto,
} from '~shared/types/form/form'

import { transformAllIsoStringsToDate } from '~utils/date'
import { ApiService } from '~services/ApiService'

import { augmentWithMyInfoDisplayValue } from '~features/myinfo/utils'
import {
  SubmitEmailFormArgs,
  SubmitStorageFormArgs,
} from '~features/public-form/PublicFormService'
import {
  createEmailSubmissionFormData,
  createEncryptedSubmissionData,
} from '~features/public-form/utils'

import { PREVIEW_MOCK_UINFIN } from '../preview/constants'

// endpoint exported for testing
export const ADMIN_FORM_ENDPOINT = 'admin/forms'

/**
 * Gets admin view of form.
 * @param formId formId of form in question
 * @returns Admin view of form
 */
export const getAdminFormView = async (
  formId: string,
): Promise<AdminFormDto> => {
  return ApiService.get<AdminFormViewDto>(`${ADMIN_FORM_ENDPOINT}/${formId}`)
    .then(({ data }) => data.form)
    .then(transformAllIsoStringsToDate)
}

/**
 * Gets the public view of a form. Used for previewing the form from the form admin page.
 * Must be a viewer, collaborator or admin.
 * @param formId formId of form in question
 * @returns Public view of a form
 */
export const previewForm = async (
  formId: string,
): Promise<PreviewFormViewDto> => {
  return ApiService.get<PreviewFormViewDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/preview`,
  )
    .then(({ data }) => {
      // Add default mock authenticated state if previewing an authenticatable form
      // and if server has not already sent back a mock authenticated state.
      if (data.form.authType !== FormAuthType.NIL && !data.spcpSession) {
        data.spcpSession = { userName: PREVIEW_MOCK_UINFIN }
      }

      // Inject MyInfo preview values into form fields (if they are MyInfo fields).
      data.form.form_fields = data.form.form_fields.map(
        augmentWithMyInfoDisplayValue,
      )

      return data
    })
    .then(transformAllIsoStringsToDate)
}

/**
 * Gets the public view of a form. Used for viewing the form from the form template page.
 * Must be an admin.
 * @param formId formId of form in question
 * @returns Public view of a form
 */
export const viewFormTemplate = async (
  formId: string,
): Promise<PreviewFormViewDto> => {
  return ApiService.get<PreviewFormViewDto>(`${formId}/use-template`)
    .then(({ data }) => {
      // Add default mock authenticated state if previewing an authenticatable form
      // and if server has not already sent back a mock authenticated state.
      if (data.form.authType !== FormAuthType.NIL && !data.spcpSession) {
        data.spcpSession = { userName: PREVIEW_MOCK_UINFIN }
      }

      // Inject MyInfo preview values into form fields (if they are MyInfo fields).
      data.form.form_fields = data.form.form_fields.map(
        augmentWithMyInfoDisplayValue,
      )

      return data
    })
    .then(transformAllIsoStringsToDate)
}

export const getFreeSmsQuota = async (formId: string) => {
  return ApiService.get<SmsCountsDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/verified-sms/count/free`,
  ).then(({ data }) => data)
}

export const getFormCollaborators = async (
  formId: string,
): Promise<FormPermissionsDto> => {
  return ApiService.get<FormPermissionsDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/collaborators`,
  ).then(({ data }) => data)
}

export const updateFormCollaborators = async (
  formId: string,
  collaborators: PermissionsUpdateDto,
): Promise<FormPermissionsDto> => {
  return ApiService.put<FormPermissionsDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/collaborators`,
    collaborators,
  ).then(({ data }) => data)
}

/**
 * Transfers ownership of form to another user with the given email.
 * @param formId formId of the form to transfer ownership for
 * @param newOwnerEmail Email of new owner
 * @returns Updated form with new ownership.
 */
export const transferFormOwner = async (
  formId: string,
  newOwnerEmail: string,
): Promise<AdminFormViewDto> => {
  return ApiService.post<AdminFormViewDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/collaborators/transfer-owner`,
    { email: newOwnerEmail },
  ).then(({ data }) => data)
}

export const removeSelfFromFormCollaborators = async (
  formId: string,
): Promise<void> => {
  return ApiService.delete(
    `${ADMIN_FORM_ENDPOINT}/${formId}/collaborators/self`,
  )
}

/**
 * Submit an email mode form in preview mode
 */
export const submitEmailModeFormPreview = async ({
  formFields,
  formInputs,
  formId,
}: SubmitEmailFormArgs): Promise<SubmissionResponseDto> => {
  const formData = createEmailSubmissionFormData(formFields, formInputs)

  return ApiService.post<SubmissionResponseDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/preview/submissions/email`,
    formData,
  ).then(({ data }) => data)
}

/**
 * Submit a storage mode form in preview mode
 */
export const submitStorageModeFormPreview = async ({
  formFields,
  formInputs,
  formId,
  publicKey,
}: SubmitStorageFormArgs) => {
  const submissionContent = await createEncryptedSubmissionData(
    formFields,
    formInputs,
    publicKey,
  )

  return ApiService.post<SubmissionResponseDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/preview/submissions/encrypt`,
    submissionContent,
  ).then(({ data }) => data)
}
