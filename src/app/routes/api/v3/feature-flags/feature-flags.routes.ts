import { Router } from 'express'

import * as FeatureFlagsController from '../../../../modules/feature-flags/feature-flags.controller'

export const FeatureFlagsRouter = Router()

/**
 * Retrieve the environment variables for the frontend.
 * @route GET /api/v3/feature-flags/enabled
 * @return 200 with list of enabled flags' documents
 */
FeatureFlagsRouter.get('/enabled', FeatureFlagsController.handleGetEnabledFlags)
