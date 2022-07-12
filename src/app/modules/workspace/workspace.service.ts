import { okAsync, ResultAsync } from 'neverthrow'

import { DatabaseError } from '../core/core.errors'
import { MissingUserError } from '../user/user.errors'

export const getWorkspaces = (): ResultAsync<
  any[],
  MissingUserError | DatabaseError
> => {
  return okAsync([])
}

export const createWorkspace = (
  workspace: any,
): ResultAsync<any, DatabaseError> => {
  return okAsync({ workspace: workspace })
}

export const updateWorkspaceTitle = (
  title: string,
): ResultAsync<any, DatabaseError> => {
  return okAsync({ title: title })
}

export const deleteWorkspace = (
  workspaceId: string,
): ResultAsync<any, DatabaseError> => {
  return okAsync({ workspaceId: workspaceId })
}

export const getForms = (
  workspaceId: string,
): ResultAsync<any, DatabaseError> => {
  return okAsync({ workspaceId: workspaceId })
}

export const deleteForms = (
  workspaceId: string,
  formIds: string[],
): ResultAsync<any, DatabaseError> => {
  return okAsync({ workspaceId: workspaceId, formIds: formIds })
}
