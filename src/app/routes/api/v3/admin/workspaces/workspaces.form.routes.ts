import { Router } from 'express'

import * as WorkspaceController from '../../../../../modules/workspace/workspace.controller'

export const WorkspacesFormRouter = Router()

WorkspacesFormRouter.route('/:workspaceId([a-fA-F0-9]{24})/forms')
  /**
   * Gets all the forms belonging to the workspace
   * @security session
   *
   * @returns 200 with a list of forms in the workspace
   * @returns 401 when user is not logged in
   * @returns 404 when the workspace does not exist or belong to the user
   * @returns 422 when user of given id cannnot be found in the database
   * @returns 500 when database errors occur
   */
  .get(WorkspaceController.getForms)

  /**
   * Delete forms belonging to the workspace
   * @security session
   *
   * @returns 200 with a list of remaining forms in the workspace
   * @returns 401 when user is not logged in
   * @returns 404 when the workspace does not exist or belong to the user
   * @returns 422 when user of given id cannnot be found in the database
   * @returns 500 when database errors occur
   */
  .delete(WorkspaceController.deleteForms)
