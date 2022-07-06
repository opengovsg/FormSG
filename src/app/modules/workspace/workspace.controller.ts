import { ErrorDto } from 'shared/types'

import { ControllerHandler } from '../core/core.types'

import * as WorkspaceService from './workspace.service'

/**
 * Handler for GET /workspaces endpoint.
 * @security session
 *
 * @returns 200 with list of user's workspaces if workspaces are retrieved successfully
 * @returns 422 when user of given id cannnot be found in the database
 * @returns 500 when database errors occur
 */
export const getWorkspaces: ControllerHandler<
  unknown,
  any[] | ErrorDto
> = async (req, res) => {
  return WorkspaceService.getWorkspaces()
    .map((workspaces) => res.json(workspaces))
    .mapErr((err) => res.status(400).json({ message: err.message }))
}
