import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../config/feature-manager'
import * as frontend from '../controllers/frontend.server.controller'

interface IGoogleAnalyticsFactory {
  datalayer: (req: Request, res: Response) => string | void
}

const googleAnalyticsFeature = FeatureManager.get(FeatureNames.GoogleAnalytics)

export const createGoogleAnalyticsFactory = (
  googleAnalyticsFeature: RegisteredFeature<FeatureNames.GoogleAnalytics>,
): IGoogleAnalyticsFactory => {
  if (!googleAnalyticsFeature.isEnabled) {
    return {
      datalayer: (req, res) => {
        res.type('text/javascript').sendStatus(StatusCodes.OK)
      },
    }
  }
  return {
    datalayer: frontend.datalayer,
  }
}

export const GoogleAnalyticsFactory = createGoogleAnalyticsFactory(
  googleAnalyticsFeature,
)
