import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../../config/feature-manager'

import * as FrontendServerController from './frontend.server.controller'

interface IGoogleAnalyticsFactory {
  addGoogleAnalyticsData: RequestHandler<
    ParamsDictionary,
    string | { message: string }
  >
}

const googleAnalyticsFeature = FeatureManager.get(FeatureNames.GoogleAnalytics)

/**
 * Factory function which returns the correct handler
 * for /frontend/datalayer endpoint depending on googleAnalyticsFeature.isEnabled
 * @param googleAnalyticsFeature
 */
export const createGoogleAnalyticsFactory = (
  googleAnalyticsFeature: RegisteredFeature<FeatureNames.GoogleAnalytics>,
): IGoogleAnalyticsFactory => {
  if (!googleAnalyticsFeature.isEnabled) {
    return {
      addGoogleAnalyticsData: (req, res) => {
        res.type('text/javascript').sendStatus(StatusCodes.OK)
      },
    }
  }
  return {
    addGoogleAnalyticsData: FrontendServerController.addGoogleAnalyticsData,
  }
}

export const GoogleAnalyticsFactory = createGoogleAnalyticsFactory(
  googleAnalyticsFeature,
)
