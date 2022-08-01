import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { WorkspaceDto } from 'shared/types/workspace'

import { createLoggerWithLabel } from '../../config/logger'
import { getWorkspaceModel } from '../../models/workspace.server.model'
import { transformMongoError } from '../../utils/handle-mongo-error'
import { DatabaseError, DatabaseValidationError } from '../core/core.errors'

import {
  ForbiddenWorkspaceError,
  WorkspaceNotFoundError,
} from './workspace.errors'

const logger = createLoggerWithLabel(module)
const WorkspaceModel = getWorkspaceModel(mongoose)

export const getWorkspaces = (
  userId: string,
): ResultAsync<WorkspaceDto[], DatabaseError> => {
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
      return transformMongoError(error)
    },
  )
}

export const createWorkspace = (
  userId: string,
  title: string,
): ResultAsync<WorkspaceDto, DatabaseError | DatabaseValidationError> => {
  return ResultAsync.fromPromise(
    WorkspaceModel.createWorkspace(title, userId),
    (error) => {
      logger.error({
        message: 'Database error when creating workspace',
        meta: {
          action: 'createWorkspace',
          userId,
          title,
        },
        error,
      })
      return transformMongoError(error)
    },
  )
}

export const updateWorkspaceTitle = ({
  workspaceId,
  title,
}: {
  workspaceId: string
  title: string
}): ResultAsync<WorkspaceDto, DatabaseError | WorkspaceNotFoundError> => {
  return ResultAsync.fromPromise(
    WorkspaceModel.updateWorkspaceTitle({ title, workspaceId }),
    (error) => {
      logger.error({
        message: 'Database error when updating workspace title',
        meta: {
          action: 'updateWorkspaceTitle',
          workspaceId,
          title,
        },
        error,
      })
      return transformMongoError(error)
    },
  ).andThen((updatedWorkspace) =>
    updatedWorkspace
      ? okAsync(updatedWorkspace)
      : errAsync(new WorkspaceNotFoundError()),
  )
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

export const getWorkspace = (
  workspaceId: string,
): ResultAsync<WorkspaceDto, DatabaseError | WorkspaceNotFoundError> => {
  return ResultAsync.fromPromise(
    WorkspaceModel.getWorkspace(workspaceId),
    (error) => {
      logger.error({
        message: 'Database error when getting workspace',
        meta: {
          action: 'getWorkspace',
          workspaceId,
        },
        error,
      })
      return transformMongoError(error)
    },
  ).andThen((workspace: WorkspaceDto) =>
    workspace ? okAsync(workspace) : errAsync(new WorkspaceNotFoundError()),
  )
}

export const verifyWorkspaceAdmin = (
  workspace: WorkspaceDto,
  userId: string,
): ResultAsync<true, ForbiddenWorkspaceError> => {
  if (workspace.admin != userId) {
    return errAsync(new ForbiddenWorkspaceError())
  }

  return okAsync(true as const)
}
