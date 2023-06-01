import { Router } from 'express'

import {
  logAdminAction,
  withUserAuthentication,
} from '../../../../../modules/auth/auth.middlewares'
import * as WorkspaceController from '../../../../../modules/workspace/workspace.controller'

import { WorkspacesFormRouter } from './workspaces.form.routes'

export const WorkspacesRouter = Router()
WorkspacesRouter.use(withUserAuthentication)
WorkspacesRouter.use(logAdminAction)

WorkspacesRouter.use(
  '/:workspaceId([a-fA-F0-9]{24})/forms',
  WorkspacesFormRouter,
)

WorkspacesRouter.route('/')
  /**
   * List the workspaces that the user owns
   * @security session
   *
   * @returns 200 with a list of workspaces owned by the user
   * @returns 401 when user is not logged in
   * @returns 409 when a database conflict error occurs
   * @returns 500 when database errors occur
   */
  .get(WorkspaceController.getWorkspaces)

  /**
   * Create a new workspace
   * @security session
   *
   * @returns 200 with newly created workspace
   * @returns 400 when Joi validation fails
   * @returns 401 when user does not exist in session
   * @returns 403 when user does not have permissions to update the workspace
   * @returns 409 when a database conflict error occurs
   * @returns 500 when database error occurs
   */
  .post(WorkspaceController.createWorkspace)

WorkspacesRouter.route('/:workspaceId([a-fA-F0-9]{24})')
  /**
   * Delete an existing workspace, forms in the deleted workspace will be deleted
   * if it is specified in the request body.
   * @security session
   *
   * @returns 200 with success message
   * @returns 401 when user does not exist in session
   * @returns 403 when user does not have permissions to delete the workspace
   * @returns 404 when workspace cannot be found
   * @returns 409 when a database conflict error occurs
   * @returns 500 when database error occurs
   */
  .delete(WorkspaceController.deleteWorkspace)

WorkspacesRouter.route('/:workspaceId([a-fA-F0-9]{24})/title')
  /**
   * Update existing workspace title
   * @security session
   *
   * @returns 200 with updated workspace
   * @returns 400 when new title fails Joi validation
   * @returns 401 when user does not exist in session
   * @returns 404 when workspace cannot be found
   * @returns 500 when database error occurs
   */
  .put(WorkspaceController.updateWorkspaceTitle)
