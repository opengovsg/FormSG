import { Router } from 'express'

import * as FrontendServerController from './frontend.controller'

/** @deprecated use client router in src/app/routes/api/v3/client/client.routes.ts instead.  */
export const FrontendRouter = Router()

/**
 * @deprecated use routes in src/app/routes/api/v3/client/client.routes.ts instead
 * Generate the templated Javascript code for the frontend to initialise Google Tag Manager
 * Code depends on whether googleAnalyticsFeature.isEnabled
 * @route GET /frontend/datalayer
 * @return 200 when code generation is successful
 * @return 400 when code generation fails
 */
FrontendRouter.get(
  '/datalayer',
  FrontendServerController.addGoogleAnalyticsData,
)

/**
 * @deprecated use routes in src/app/routes/api/v3/client/client.routes.ts instead
 * Generate the templated Javascript code with environment variables for the frontend
 * @route GET /frontend/environment
 * @return 200 when code generation is successful
 * @return 400 when code generation fails
 */
FrontendRouter.get('/environment', FrontendServerController.addEnvVarData)

/**
 * @deprecated use routes in src/app/routes/api/v3/client/client.routes.ts instead
 * Generate a json of current activated features
 * @route GET /frontend/features
 * @return json with featureManager.states
 * @deprecated
 * TODO (#2147): delete this
 */
FrontendRouter.get('/features', FrontendServerController.showFeaturesStates)

/**
 * @deprecated use routes in src/app/routes/api/v3/client/client.routes.ts instead
 * Generate the javascript code to redirect to the correct url
 * @route GET /frontend/redirect
 * @return 200 when redirect code is  successful
 * @return 400 when redirect code fails
 */
FrontendRouter.get('/redirect', FrontendServerController.generateRedirectUrl)
