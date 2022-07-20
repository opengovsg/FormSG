import { celebrate, Segments } from 'celebrate'
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
const createWorkspaceValidator = celebrate({
  [Segments.BODY]: {},
})

const updateWorkspaceTitleValidator = celebrate({
  [Segments.BODY]: {},
})

/**
 * Handler for GET /workspaces endpoint.
 * @security session
 *
 * @returns 200 with list of user's workspaces if workspaces are retrieved successfully
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
 * @returns 409 when a database conflict error occurs
 * @returns 422 when user of given id cannnot be found in the database
 * @returns 500 when database error occurs
 */
const handleCreateWorkspace: ControllerHandler<
  unknown,
  any | ErrorDto,
  { workspace: any }
> = async (req, res) => {
  const { workspace } = req.body

  return WorkspaceService.createWorkspace('', workspace)
    .map((workspace) => res.status(StatusCodes.OK).json(workspace))
    .mapErr((err) =>
      res.status(StatusCodes.BAD_REQUEST).json({ message: err.message }),
    )
}

export const createWorkspace = [
  createWorkspaceValidator,
  handleCreateWorkspace,
] as ControllerHandler[]

/**
 * Handler for PUT /workspaces/:workspaceId/title endpoint
 * @security session
 *
 * @returns 200 with updated workspace
 * @returns 404 when workspace cannot be found
 * @returns 422 when user of given id cannnot be found in the database
 * @returns 500 when database error occurs
 */
const handleUpdateWorkspaceTitle: ControllerHandler<
  unknown,
  any | ErrorDto,
  { title: string }
> = async (req, res) => {
  const { title } = req.body
  return WorkspaceService.updateWorkspaceTitle('', title)
    .map((workspace) => res.status(StatusCodes.OK).json(workspace))
    .mapErr((err) =>
      res.status(StatusCodes.BAD_REQUEST).json({ message: err.message }),
    )
}

export const updateWorkspaceTitle = [
  updateWorkspaceTitleValidator,
  handleUpdateWorkspaceTitle,
] as ControllerHandler[]

/**
 * Handler for DELETE /workspaces/:workspaceId endpoint
 * @security session
 *
 * @returns 200 with success message
 * @returns 404 when workspace cannot be found
 * @returns 422 when user of given id cannnot be found in the database
 * @returns 500 when database error occurs
 */
export const deleteWorkspace: ControllerHandler<
  { workspaceId: string },
  any | ErrorDto,
  { shouldDeleteForms: boolean }
> = async (req, res) => {
  const { workspaceId } = req.params
  const { shouldDeleteForms } = req.body

  return WorkspaceService.deleteWorkspace(workspaceId, shouldDeleteForms)
    .map(() =>
      res
        .status(StatusCodes.OK)
        .json({ message: 'Successfully deleted workspace' }),
    )
    .mapErr((err) =>
      res.status(StatusCodes.BAD_REQUEST).json({ message: err.message }),
    )
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
