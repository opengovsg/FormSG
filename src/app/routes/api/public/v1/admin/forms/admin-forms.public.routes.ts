import { Router } from 'express'

import { rateLimitConfig } from '../../../../../../config/config'
import { authenticateApiKey } from '../../../../../../modules/auth/auth.middlewares'
import * as AdminFormController from '../../../../../../modules/form/admin-form/admin-form.controller'
import { limitRate } from '../../../../../../utils/limit-rate'

export const AdminFormsPublicRouter = Router()

// All routes in this handler should be protected by authentication.
AdminFormsPublicRouter.use(authenticateApiKey)

AdminFormsPublicRouter.route('/')
  /**
   * List the forms managed by the user
   * @security session
   *
   * @returns 200 with a list of forms managed by the user
   * @returns 401 when user is not authorised
   * @returns 422 when user of given id cannnot be found in the database
   * @returns 500 when database errors occur
   */
  .get(
    limitRate({ max: rateLimitConfig.publicApi }),
    AdminFormController.handleListDashboardForms,
  )
