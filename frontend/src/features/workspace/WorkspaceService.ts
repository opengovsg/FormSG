import {
  AdminDashboardFormMetaDto,
  CreateEmailFormBodyDto,
  CreateStorageFormBodyDto,
  FormDto,
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
