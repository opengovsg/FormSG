import { okAsync, ResultAsync } from 'neverthrow'

import { DatabaseError } from '../core/core.errors'
import { MissingUserError } from '../user/user.errors'

export const getWorkspaces = (
  userId: string,
): ResultAsync<any, MissingUserError | DatabaseError> => {
  return okAsync([userId])
}

export const createWorkspace = (
  userId: string,
  workspace: any,
): ResultAsync<any, DatabaseError> => {
  return okAsync({ workspace: workspace, userId: userId })
}

export const updateWorkspaceTitle = (
  workspaceId: string,
  title: string,
): ResultAsync<any, DatabaseError> => {
  return okAsync({ title: title, workspaceId: workspaceId })
}

export const deleteWorkspace = (
  workspaceId: string,
  shouldDeleteForms: boolean,
): ResultAsync<any, DatabaseError> => {
  return okAsync({
    workspaceId: workspaceId,
    shouldDeleteForms: shouldDeleteForms,
  })
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

export const moveForms = (
  sourceWorkspaceId: string,
  destWorkspaceId: string,
  formIds: string[],
): ResultAsync<any, DatabaseError> => {
  return okAsync({
    sourceWorkspaceId: sourceWorkspaceId,
    destWorkspaceId: destWorkspaceId,
    formIds: formIds,
  })
}
