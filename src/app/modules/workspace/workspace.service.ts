import mongoose from 'mongoose'
import { okAsync, ResultAsync } from 'neverthrow'
import { WorkspaceDto } from 'shared/types/workspace'

import { createLoggerWithLabel } from '../../config/logger'
import { getWorkspaceModel } from '../../models/workspace.server.model'
import { DatabaseError } from '../core/core.errors'
import { MissingUserError } from '../user/user.errors'

const logger = createLoggerWithLabel(module)
const WorkspaceModel = getWorkspaceModel(mongoose)

export const getWorkspaces = (
  userId: string,
): ResultAsync<WorkspaceDto[], MissingUserError | DatabaseError> => {
  return ResultAsync.fromPromise(
    WorkspaceModel.getWorkspaces(userId),
    (error) => {
      logger.error({
        message: 'Database error when retrieving workspaces',
        meta: {
          action: 'getWorkspaces',
          userId,
        },
        error,
      })
      return new DatabaseError()
    },
  )
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
