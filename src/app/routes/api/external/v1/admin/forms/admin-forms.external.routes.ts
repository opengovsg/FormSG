import { Router } from 'express'

import { authenticateApiKey } from '../../../../../../modules/auth/auth.middlewares'
import * as AdminFormController from '../../../../../../modules/form/admin-form/admin-form.controller'

export const AdminFormsExternalRouter = Router()

// All routes in this handler should be protected by authentication.
AdminFormsExternalRouter.use(authenticateApiKey)

// Log all non-get admin form actions
// AdminFormsExternalRouter.use('/:formId([a-fA-F0-9]{24})', logAdminAction)

AdminFormsExternalRouter.route('/')
  /**
   * List the forms managed by the user
   * @security session
   *
   * @returns 200 with a list of forms managed by the user
   * @returns 401 when user is not logged in
   * @returns 422 when user of given id cannnot be found in the database
   * @returns 500 when database errors occur
   */
  .get(AdminFormController.handleListDashboardForms)
