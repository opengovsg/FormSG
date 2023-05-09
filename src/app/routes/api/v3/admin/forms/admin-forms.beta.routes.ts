import { Router } from 'express'

import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'

export const AdminFormsBetaRouter = Router()

/**
 * Retrieve the environment variables for the frontend.
 * @route GET /api/v3/global-beta
 * @return 200 with environment variables needed for the client
 */
AdminFormsBetaRouter.get(
  '/global-beta',
  AdminFormController.handleGetGlobalBeta,
)
