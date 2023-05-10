import { Router } from 'express'

import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'

export const AdminFormsFeatureFlagsRouter = Router()

/**
 * Retrieve the environment variables for the frontend.
 * @route GET /api/v3/admin/forms/feature-flag
 * @return 200 with environment variables needed for the client
 */
AdminFormsFeatureFlagsRouter.get(
  '/feature-flag',
  AdminFormController.handleGetFeatureFlag,
)
