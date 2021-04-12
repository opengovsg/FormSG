import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import * as FrontendServerController from '../../../../modules/frontend/frontend.controller'
import { GoogleAnalyticsFactory } from '../../../../modules/frontend/google-analytics.factory'

export const ClientRouter = Router()

/**
 * @route GET /api/v3/client/analytics/google
 */
ClientRouter.route('/analytics/google').get(
  GoogleAnalyticsFactory.addGoogleAnalyticsData,
)

/**
 * @route GET /api/v3/client/environment
 */
ClientRouter.route('/environment').get(FrontendServerController.addEnvVarData)

/**
 * @route GET /api/v3/client/redirect
 */
ClientRouter.route('/redirect').get(
  celebrate({
    [Segments.QUERY]: {
      redirectPath: Joi.string()
        .regex(/^[a-fA-F0-9]{24}(\/(preview|template|use-template))?/)
        .required(),
    },
  }),
  FrontendServerController.generateRedirectUrl,
)

/**
 * @route GET /api/v3/client/features
 */
ClientRouter.route('/features').get((req, res) => {
  res.json(FrontendServerController.showFeaturesStates)
})
