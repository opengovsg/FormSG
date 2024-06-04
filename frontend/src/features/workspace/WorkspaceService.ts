import { AdminFeedbackDto, AdminFeedbackRating } from '~shared/types'
import {
  AdminDashboardFormMetaDto,
  CreateEmailFormBodyDto,
  CreateMultirespondentFormBodyDto,
  CreateStorageFormBodyDto,
  DuplicateFormBodyDto,
  FormDto,
  FormId,
} from '~shared/types/form/form'
import { WorkspaceDto } from '~shared/types/workspace'

import { ApiService } from '~services/ApiService'

export const ADMIN_FORM_ENDPOINT = '/admin/forms'
const ADMIN_WORKSPACES_ENDPOINT = '/admin/workspaces'

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

export const getWorkspacesView = async (): Promise<WorkspaceDto[]> => {
  return ApiService.get<WorkspaceDto[]>(`${ADMIN_WORKSPACES_ENDPOINT}`).then(
    ({ data }) => data,
  )
}

export const createWorkspace = async ({
  title,
}: {
  title: string
}): Promise<WorkspaceDto> => {
  return ApiService.post<WorkspaceDto>(`${ADMIN_WORKSPACES_ENDPOINT}`, {
    title,
  }).then(({ data }) => data)
}

export const moveFormsToWorkspace = async ({
  formIds,
  destWorkspaceId,
}: {
  formIds: string[]
  destWorkspaceId: string
}): Promise<string[]> => {
  return ApiService.post<string[]>(`${ADMIN_WORKSPACES_ENDPOINT}/move`, {
    formIds,
    destWorkspaceId,
  }).then(({ data }) => data)
}

export const updateWorkspaceTitle = async ({
  title,
  destWorkspaceId,
}: {
  title: string
  destWorkspaceId: string
}): Promise<WorkspaceDto> => {
  return ApiService.put<WorkspaceDto>(
    `${ADMIN_WORKSPACES_ENDPOINT}/${destWorkspaceId}/title`,
    {
      title,
    },
  ).then(({ data }) => data)
}

export const deleteWorkspace = async ({
  destWorkspaceId,
}: {
  destWorkspaceId: string
}): Promise<void> => {
  return ApiService.delete(`${ADMIN_WORKSPACES_ENDPOINT}/${destWorkspaceId}`)
}

export const removeFormsFromWorkspaces = async ({
  formIds,
}: {
  formIds: string[]
}): Promise<void> => {
  return ApiService.post(`${ADMIN_WORKSPACES_ENDPOINT}/remove`, { formIds })
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

export const createMultirespondentModeForm = async (
  body: CreateMultirespondentFormBodyDto,
): Promise<FormDto> => {
  return ApiService.post<FormDto>(ADMIN_FORM_ENDPOINT, { form: body }).then(
    ({ data }) => data,
  )
}

export const dupeEmailModeForm = async (
  formId: string,
  body: DuplicateFormBodyDto,
): Promise<FormDto> => {
  return ApiService.post<FormDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/duplicate`,
    body,
  ).then(({ data }) => data)
}

export const dupeStorageModeForm = async (
  formId: FormId,
  body: DuplicateFormBodyDto,
): Promise<FormDto> => {
  return ApiService.post<FormDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/duplicate`,
    body,
  ).then(({ data }) => data)
}

export const dupeMultirespondentModeForm = async (
  formId: string,
  body: DuplicateFormBodyDto,
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
