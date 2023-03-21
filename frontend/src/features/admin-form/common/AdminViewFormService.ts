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

import { ADMINFORM_USETEMPLATE_ROUTE } from '~constants/routes'
import { transformAllIsoStringsToDate } from '~utils/date'
import { API_BASE_URL, ApiService } from '~services/ApiService'

import { augmentWithMyInfoDisplayValue } from '~features/myinfo/utils'
import {
  SubmitEmailFormArgs,
  SubmitStorageFormArgs,
} from '~features/public-form/PublicFormService'
import {
  createEmailSubmissionFormData,
  createEncryptedSubmissionData,
  filterHiddenInputs,
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
  return ApiService.get<PreviewFormViewDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/${ADMINFORM_USETEMPLATE_ROUTE}`,
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
  formLogics,
  formInputs,
  formId,
}: SubmitEmailFormArgs): Promise<SubmissionResponseDto> => {
  const filteredInputs = filterHiddenInputs({
    formFields,
    formInputs,
    formLogics,
  })
  const formData = createEmailSubmissionFormData(formFields, filteredInputs)

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
  formLogics,
  formInputs,
  formId,
  publicKey,
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
    `${ADMIN_FORM_ENDPOINT}/${formId}/preview/submissions/encrypt`,
    submissionContent,
  ).then(({ data }) => data)
}

/**
 * Submit an email mode form in preview mode using fetch
 * TODO(#5826): Fallback using Fetch. Remove once network error is resolved
 */
export const submitEmailModeFormPreviewWithFetch = async ({
  formFields,
  formLogics,
  formInputs,
  formId,
}: SubmitEmailFormArgs): Promise<SubmissionResponseDto> => {
  const filteredInputs = filterHiddenInputs({
    formFields,
    formInputs,
    formLogics,
  })
  const formData = createEmailSubmissionFormData(formFields, filteredInputs)

  const response = await fetch(
    `${API_BASE_URL}/${ADMIN_FORM_ENDPOINT}/${formId}/preview/submissions/email`,
    {
      method: 'POST',
      body: formData,
    },
  )
  return response.json()
}

/**
 * Submit a storage mode form in preview mode using fetch
 * TODO(#5826): Fallback using Fetch. Remove once network error is resolved
 */
export const submitStorageModeFormPreviewWithFetch = async ({
  formFields,
  formLogics,
  formInputs,
  formId,
  publicKey,
}: SubmitStorageFormArgs): Promise<SubmissionResponseDto> => {
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

  const response = await fetch(
    `${API_BASE_URL}/${ADMIN_FORM_ENDPOINT}/${formId}/preview/submissions/encrypt`,
    {
      method: 'POST',
      body: JSON.stringify(submissionContent),
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
  return response.json()
}
