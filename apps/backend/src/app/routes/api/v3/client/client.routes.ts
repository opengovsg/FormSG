import { Router } from 'express'

import * as FrontendController from '../../../../modules/frontend/frontend.controller'

export const ClientRouter = Router()

/**
 * Retrieve the environment variables for the frontend.
 * @route GET /api/v3/client/env
 * @return 200 with environment variables needed for the client
 */
ClientRouter.get('/env', FrontendController.handleGetEnvironment)
