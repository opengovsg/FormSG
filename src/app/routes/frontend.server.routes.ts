import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import * as FrontendServerController from '../controllers/frontend.server.controller'
import { GoogleAnalyticsFactory } from '../factories/google-analytics.factory'

export const FrontendRouter = Router()

/**
 * Generate the templated Javascript code for the frontend to initialise Google Tag Manager
 * Code depends on whether googleAnalyticsFeature.isEnabled
 * @route GET /frontend/datalayer
 * @return 200 when code generation is successful
 * @return 400 when code generation fails
 */
FrontendRouter.get('/frontend/datalayer', GoogleAnalyticsFactory.datalayer)

/**
 * Generate the templated Javascript code with environment variables for the frontend
 * @route GET /frontend/environment
 * @return 200 when code generation is successful
 * @return 400 when code generation fails
 */
FrontendRouter.get(
  '/frontend/environment',
  FrontendServerController.environment,
)

/**
 * Generate a json of current activated features
 * @route GET /frontend/features
 * @return json with featureManager.states
 */
FrontendRouter.get('/frontend/features', FrontendServerController.features)

/**
 * Generate the javascript code to redirect to the correct url
 * @route GET /frontend/redirect
 * @return 200 when redirect code is  successful
 * @return 400 when redirect code fails
 */
FrontendRouter.get(
  '/frontend/redirect',
  celebrate({
    [Segments.QUERY]: {
      redirectPath: Joi.string()
        .regex(/^[a-fA-F0-9]{24}(\/(preview|template|use-template))?/)
        .required(),
    },
  }),
  FrontendServerController.redirectLayer,
)
