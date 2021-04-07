import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import featureManager from '../../../../../config/feature-manager'
import frontendCtrl from '../../../../controllers/frontend.server.controller'
import googleAnalyticsFactory from '../../../../factories/google-analytics.factory'

export const ClientRouter = Router()

/**
 * @route GET /api/v3/client/analytics/google
 */
ClientRouter.route('/analytics/google').get(googleAnalyticsFactory.datalayer)

/**
 * @route GET /api/v3/client/environment
 */
ClientRouter.route('/environment').get(frontendCtrl.environment)

/**
 * @route GET /api/v3/client/features
 */
ClientRouter.route('/redirect').get(
  celebrate({
    [Segments.QUERY]: {
      redirectPath: Joi.string()
        .regex(/^[a-fA-F0-9]{24}(\/(preview|template|use-template))?/)
        .required(),
    },
  }),
  frontendCtrl.redirectLayer,
)

/**
 * @route GET /api/v3/client/redirect
 */
ClientRouter.route('/features').get((req, res) => {
  res.json(featureManager.states)
})
