import { celebrate, Joi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import { StatusCodes } from 'http-status-codes'
import { ErrorDto } from 'shared/types'
import { WorkspaceDto } from 'shared/types/workspace'

import { createLoggerWithLabel } from '../../config/logger'
import { ControllerHandler } from '../core/core.types'

import * as WorkspaceService from './workspace.service'
import { mapRouteError } from './workspace.utils'

const logger = createLoggerWithLabel(module)

// Validators
const workspaceTitleValidator = celebrate({
  [Segments.BODY]: {
    title: Joi.string().min(4).max(50).required(),
  },
})

/**
 * Handler for GET /workspaces endpoint.
 * @security session
 *
 * @returns 200 with list of user's workspaces if workspaces are retrieved successfully
 * @returns 409 when a database conflict error occurs
 * @returns 500 when database errors occur
 */
export const getWorkspaces: ControllerHandler<
  unknown,
  WorkspaceDto[] | ErrorDto
> = async (req, res) => {
  const userId = (req.session as AuthedSessionData).user._id

  return WorkspaceService.getWorkspaces(userId)
    .map((workspaces) => res.status(StatusCodes.OK).json(workspaces))
    .mapErr((error) => {
      logger.error({
        message: 'Error getting workspaces',
        meta: {
          action: 'getWorkspaces',
          userId,
        },
        error,
      })

      const { statusCode, errorMessage } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * Handler for POST /workspaces endpoint
 * @security session
 *
 * @returns 200 with newly created workspace
 * @returns 400 when workspace title is invalid
 * @returns 409 when a database conflict error occurs
 * @returns 500 when database error occurs
 */
export const handleCreateWorkspace: ControllerHandler<
  unknown,
  WorkspaceDto | ErrorDto,
  { title: string }
> = async (req, res) => {
  const { title } = req.body
  const userId = (req.session as AuthedSessionData).user._id

  return WorkspaceService.createWorkspace(userId, title)
    .map((workspace) => res.status(StatusCodes.OK).json(workspace))
    .mapErr((error) => {
      logger.error({
        message: 'Error creating workspace',
        meta: {
          action: 'handleCreateWorkspace',
          userId,
          title,
        },
        error,
      })

      const { statusCode, errorMessage } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

export const createWorkspace = [
  workspaceTitleValidator,
  handleCreateWorkspace,
] as ControllerHandler[]

/**
 * Handler for PUT /workspaces/:workspaceId/title endpoint
 * @security session
 *
 * @returns 200 with updated workspace
 * @returns 403 when user does not have permissions to update the workspace
 * @returns 404 when workspace cannot be found
 * @returns 409 when a database conflict error occurs
 * @returns 500 when database error occurs
 */
export const handleUpdateWorkspaceTitle: ControllerHandler<
  { workspaceId: string },
  WorkspaceDto | ErrorDto,
  { title: string }
> = async (req, res) => {
  const { workspaceId } = req.params
  const { title } = req.body
  const userId = (req.session as AuthedSessionData).user._id

  return WorkspaceService.getWorkspace(workspaceId)
    .andThen((workspace) =>
      WorkspaceService.verifyWorkspaceAdmin(workspace, userId),
    )
    .andThen(() =>
      WorkspaceService.updateWorkspaceTitle({ workspaceId, title }).map(
        (workspace) =>
          workspace
            ? res.status(StatusCodes.OK).json(workspace)
            : res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message:
                  'Sorry something went wrong, we are unable to update the workspace title',
              }),
      ),
    )
    .mapErr((error) => {
      logger.error({
        message: 'Error updating workspace title',
        meta: {
          action: 'handleUpdateWorkspaceTitle',
          title,
          workspaceId,
        },
        error,
      })

      const { statusCode, errorMessage } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

export const updateWorkspaceTitle = [
  workspaceTitleValidator,
  handleUpdateWorkspaceTitle,
] as ControllerHandler[]

/**
 * Handler for DELETE /workspaces/:workspaceId endpoint
 * @security session
 *
 * @returns 200 with success message
 * @returns 403 when user does not have permissions to delete the workspace
 * @returns 404 when workspace cannot be found
 * @returns 409 when a database conflict error occurs
 * @returns 500 when database error occurs
 */
export const deleteWorkspace: ControllerHandler<
  { workspaceId: string },
  ErrorDto,
  { shouldDeleteForms: boolean }
> = async (req, res) => {
  const { workspaceId } = req.params
  const { shouldDeleteForms } = req.body
  const userId = (req.session as AuthedSessionData).user._id

  return WorkspaceService.getWorkspace(workspaceId)
    .andThen((workspace) =>
      WorkspaceService.verifyWorkspaceAdmin(workspace, userId),
    )
    .andThen(() =>
      WorkspaceService.deleteWorkspace({
        workspaceId,
        userId,
        shouldDeleteForms,
      }).map((workspace) => {
        return workspace
          ? res
              .status(StatusCodes.OK)
              .json({ message: 'Successfully deleted workspace' })
          : res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
              message:
                'Sorry something went wrong, we are unable to delete the workspace',
            })
      }),
    )
    .mapErr((error) => {
      logger.error({
        message: 'Error deleting workspace',
        meta: {
          action: 'deleteWorkspace',
          workspaceId,
          userId,
        },
        error,
      })

      const { statusCode, errorMessage } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * Handler for GET /workspaces/:workspaceId/forms endpoint
 * @security session
 *
 * @returns 200 with a list of forms in the workspace
 * @returns 404 when the workspace does not exist or belong to the user
 * @returns 422 when user of given id cannnot be found in the database
 * @returns 500 when database errors occur
 */
export const getForms: ControllerHandler<
  { workspaceId: string },
  unknown,
  any | ErrorDto
> = async (req, res) => {
  const { workspaceId } = req.params

  return WorkspaceService.getForms(workspaceId)
    .map((forms) => res.status(StatusCodes.OK).json(forms))
    .mapErr((err) =>
      res.status(StatusCodes.BAD_REQUEST).json({ message: err.message }),
    )
}

/**
 * Handler for DELETE /workspaces/:workspaceId/forms endpoint
 * @security session
 *
 * @returns 200 with a list of remaining forms in the workspace
 * @returns 404 when the workspace does not exist or belong to the user
 * @returns 422 when user of given id cannnot be found in the database
 * @returns 500 when database errors occur
 */
export const deleteForms: ControllerHandler<
  { workspaceId: string },
  unknown,
  any | ErrorDto,
  { formIds: any[] }
> = async (req, res) => {
  const { workspaceId } = req.params
  const { formIds } = req.body

  return WorkspaceService.deleteForms(workspaceId, formIds)
    .map((forms) => res.status(StatusCodes.OK).json(forms))
    .mapErr((err) =>
      res.status(StatusCodes.BAD_REQUEST).json({ message: err.message }),
    )
}

/**
 * Handler for POST /workspaces/:workspaceId/forms/move endpoint
 * @security session
 *
 * @returns 200 with a list of remaining forms in the source workspace
 * @returns 404 when the workspace does not exist or belong to the user
 * @returns 422 when user of given id cannnot be found in the database
 * @returns 500 when database errors occur
 */
export const moveForms: ControllerHandler<
  { sourceWorkspaceId: string },
  unknown,
  any | ErrorDto,
  { formIds: any[]; destWorkspaceId: string }
> = async (req, res) => {
  const { sourceWorkspaceId } = req.params
  const { formIds, destWorkspaceId } = req.body

  return WorkspaceService.moveForms(sourceWorkspaceId, destWorkspaceId, formIds)
    .map((forms) => res.status(StatusCodes.OK).json(forms))
    .mapErr((err) =>
      res.status(StatusCodes.BAD_REQUEST).json({ message: err.message }),
    )
}
