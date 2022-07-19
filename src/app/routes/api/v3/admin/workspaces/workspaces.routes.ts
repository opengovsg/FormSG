import { Router } from 'express'

import * as WorkspaceController from '../../../../../modules/workspace/workspace.controller'

export const WorkspacesRouter = Router()

WorkspacesRouter.route('/')
  /**
   * List the workspaces that the user owns
   * @security session
   *
   * @returns 200 with a list of workspaces owned by the user
   * @returns 401 when user is not logged in
   * @returns 422 when user of given id cannnot be found in the database
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
   * @returns 409 when a database conflict error occurs
   * @returns 422 when user of given id cannnot be found in the database
   * @returns 500 when database error occurs
   */
  .post(WorkspaceController.createWorkspace)

WorkspacesRouter.route('/:workspaceId([a-fA-F0-9]{24})')
  /**
   * Delete an existing workspace
   * @security session
   *
   * @returns 200 with success message
   * @returns 401 when user does not exist in session
   * @returns 404 when workspace cannot be found
   * @returns 422 when user of given id cannnot be found in the database
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
   * @returns 422 when user of given id cannnot be found in the database
   * @returns 500 when database error occurs
   */
  .put(WorkspaceController.updateWorkspaceTitle)
