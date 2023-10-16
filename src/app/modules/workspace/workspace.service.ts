import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { WorkspaceDto } from 'shared/types/workspace'

import { createLoggerWithLabel } from '../../config/logger'
import { getWorkspaceModel } from '../../models/workspace.server.model'
import { transformMongoError } from '../../utils/handle-mongo-error'
import {
  DatabaseError,
  DatabaseValidationError,
  PossibleDatabaseError,
} from '../core/core.errors'
import * as AdminFormService from '../form/admin-form/admin-form.service'

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

export const deleteWorkspace = ({
  workspaceId,
  userId,
  shouldDeleteForms,
}: {
  workspaceId: string
  userId: string
  shouldDeleteForms: boolean
}): ResultAsync<WorkspaceDto | null, PossibleDatabaseError> => {
  return ResultAsync.fromPromise(
    deleteWorkspaceTransaction({ workspaceId, userId, shouldDeleteForms }),
    (error) => {
      logger.error({
        message:
          'Database error when deleting workspace, rolling back transaction',
        meta: {
          action: 'deleteWorkspace',
          workspaceId,
          shouldDeleteForms,
        },
        error,
      })
      return transformMongoError(error)
    },
  )
}

const deleteWorkspaceTransaction = async ({
  workspaceId,
  userId,
  shouldDeleteForms,
}: {
  workspaceId: string
  userId: string
  shouldDeleteForms: boolean
}): Promise<WorkspaceDto | null> => {
  let deleted: WorkspaceDto | null

  const session = await WorkspaceModel.startSession()
  return session
    .withTransaction(async () => {
      deleted = await WorkspaceModel.deleteWorkspace({
        workspaceId,
        session,
      })

      if (shouldDeleteForms && deleted?.formIds) {
        await AdminFormService.archiveForms({
          formIds: deleted?.formIds,
          admin: userId,
          session,
        })
      }
    })
    .then(() => deleted)
    .finally(() => session.endSession())
}

export const moveForms = ({
  userId,
  destWorkspaceId,
  formIds,
}: {
  userId: string
  destWorkspaceId: string
  formIds: string[]
}): ResultAsync<WorkspaceDto | null, PossibleDatabaseError> => {
  return ResultAsync.fromPromise(
    moveFormsTransaction({
      userId,
      destWorkspaceId,
      formIds,
    }),
    (error) => {
      logger.error({
        message:
          'Database error when moving forms to another workspace, rolling back transaction',
        meta: {
          action: 'moveForms',
          destWorkspaceId,
          formIds,
        },
        error,
      })
      return transformMongoError(error)
    },
  )
}

const moveFormsTransaction = async ({
  userId,
  destWorkspaceId,
  formIds,
}: {
  userId: string
  destWorkspaceId: string
  formIds: string[]
}): Promise<WorkspaceDto | null> => {
  let destWorkspace: WorkspaceDto | null

  const session = await WorkspaceModel.startSession()
  return session
    .withTransaction(async () => {
      // Forms could be from multiple different workspaces, from one source workspace, or have no workspaces yet
      await WorkspaceModel.removeFormIdsFromAllWorkspaces({
        admin: userId,
        formIds,
        session,
      })

      destWorkspace = await WorkspaceModel.addFormIdsToWorkspace({
        workspaceId: destWorkspaceId,
        formIds,
        session,
      })
    })
    .then(() => destWorkspace)
    .finally(() => session.endSession())
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
  if (workspace.admin.toString() !== userId) {
    return errAsync(new ForbiddenWorkspaceError())
  }

  return okAsync(true as const)
}

export const removeFormsFromAllWorkspaces = ({
  formIds,
  userId,
}: {
  formIds: string[]
  userId: string
}): ResultAsync<true, DatabaseError> => {
  return ResultAsync.fromPromise(
    WorkspaceModel.removeFormIdsFromAllWorkspaces({
      admin: userId,
      formIds,
    }),
    (error) => {
      logger.error({
        message:
          'Database error encountered when removing forms from all workspaces',
        meta: {
          action: 'removeFormsFromAllWorkspaces',
          formIds,
          userId,
        },
        error,
      })

      return transformMongoError(error)
      // On success, return true
    },
  ).map(() => true)
}
