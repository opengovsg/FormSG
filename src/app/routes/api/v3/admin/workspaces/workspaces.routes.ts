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
