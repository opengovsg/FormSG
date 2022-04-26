import {
  AdminFormDto,
  AdminFormViewDto,
  FormPermissionsDto,
  PermissionsUpdateDto,
  PreviewFormViewDto,
  SmsCountsDto,
} from '~shared/types/form/form'

import { transformAllIsoStringsToDate } from '~utils/date'
import { ApiService } from '~services/ApiService'

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
  ).then(({ data }) => data)
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
