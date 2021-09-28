import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import * as FrontendServerController from '../../../../modules/frontend/frontend.controller'

export const ClientRouter = Router()

/**
 * Generate the templated Javascript code for the frontend to initialise Google Tag Manager
 * Code depends on whether googleAnalyticsFeature.isEnabled
 * @route GET /api/v3/client/analytics/google
 * @return 200 when code generation is successful
 * @return 400 when code generation fails
 */
ClientRouter.get(
  '/analytics/google',
  FrontendServerController.addGoogleAnalyticsData,
)

/**
 * @deprecated use '/env' endpoint instead.
 * Generate the templated Javascript code with environment variables for the frontend
 * @route GET /api/v3/client/environment
 * @return 200 when code generation is successful
 * @return 400 when code generation fails
 */
ClientRouter.get('/environment', FrontendServerController.addEnvVarData)

/**
 * Retrieve the environment variables for the frontend.
 * @route GET /api/v3/client/env
 * @return 200 with environment variables needed for the client
 */
ClientRouter.get('/env', FrontendServerController.handleGetEnvironment)

/**
 * Generate a json of current activated features
 * @route GET /api/v3/client/features
 * @return json with featureManager.states
 * @deprecated
 * TODO (#2147): delete this
 */
ClientRouter.get('/features', FrontendServerController.showFeaturesStates)

/**
 * Generate the javascript code to redirect to the correct url
 * @route GET /api/v3/client/redirect
 * @return 200 when redirect code is  successful
 * @return 400 when redirect code fails
 */
ClientRouter.get(
  '/redirect',
  celebrate({
    [Segments.QUERY]: {
      redirectPath: Joi.string()
        .regex(/^[a-fA-F0-9]{24}(\/(preview|template|use-template))?/)
        .required(),
    },
  }),
  FrontendServerController.generateRedirectUrl,
)
