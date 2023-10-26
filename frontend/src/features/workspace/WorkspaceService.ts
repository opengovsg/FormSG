import { AdminFeedbackDto, AdminFeedbackRating } from '~shared/types'
import {
  AdminDashboardFormMetaDto,
  CreateEmailFormBodyDto,
  CreateStorageFormBodyDto,
  FormDto,
} from '~shared/types/form/form'

import { ApiService } from '~services/ApiService'

export const ADMIN_FORM_ENDPOINT = '/admin/forms'

/**
 * Gets metadata for all forms in dashboard view i.e. forms which user
 * owns or collaborates on
 * @returns Metadata required for forms on dashboard view
 */
export const getDashboardView = async (): Promise<
  AdminDashboardFormMetaDto[]
> => {
  return ApiService.get<AdminDashboardFormMetaDto[]>(
    `${ADMIN_FORM_ENDPOINT}`,
  ).then(({ data }) => data)
}

export const createEmailModeForm = async (
  body: CreateEmailFormBodyDto,
): Promise<FormDto> => {
  return ApiService.post<FormDto>(ADMIN_FORM_ENDPOINT, { form: body }).then(
    ({ data }) => data,
  )
}

export const createStorageModeForm = async (
  body: CreateStorageFormBodyDto,
): Promise<FormDto> => {
  return ApiService.post<FormDto>(ADMIN_FORM_ENDPOINT, { form: body }).then(
    ({ data }) => data,
  )
}

export const dupeEmailModeForm = async (
  formId: string,
  body: CreateEmailFormBodyDto,
): Promise<FormDto> => {
  return ApiService.post<FormDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/duplicate`,
    body,
  ).then(({ data }) => data)
}

export const dupeStorageModeForm = async (
  formId: string,
  body: CreateStorageFormBodyDto,
): Promise<FormDto> => {
  return ApiService.post<FormDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/duplicate`,
    body,
  ).then(({ data }) => data)
}

export const deleteAdminForm = async (formId: string): Promise<void> => {
  return ApiService.delete(`${ADMIN_FORM_ENDPOINT}/${formId}`)
}

export const createAdminFeedback = async (
  rating: AdminFeedbackRating,
): Promise<AdminFeedbackDto> => {
  return ApiService.post(`${ADMIN_FORM_ENDPOINT}/feedback`, { rating }).then(
    ({ data }) => data.feedback,
  )
}

export const updateAdminFeedback = async (
  feedbackId: string,
  comment: string,
): Promise<boolean> => {
  return ApiService.patch(`${ADMIN_FORM_ENDPOINT}/feedback/${feedbackId}`, {
    comment,
  }).then(({ data }) => data)
}
