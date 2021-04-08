import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import * as FrontendServerController from '../controllers/frontend.server.controller'
import { GoogleAnalyticsFactory } from '../factories/google-analytics.factory'

export const FrontendRouter = Router()

FrontendRouter.get('/frontend/datalayer', GoogleAnalyticsFactory.datalayer)

FrontendRouter.get(
  '/frontend/environment',
  FrontendServerController.environment,
)

FrontendRouter.get('/frontend/features', FrontendServerController.features)

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
