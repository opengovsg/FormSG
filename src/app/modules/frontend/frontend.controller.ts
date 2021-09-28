import ejs from 'ejs'
import { StatusCodes } from 'http-status-codes'

import { ClientEnvVars } from '../../../../shared/types/core'
import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'

import { getClientEnvVars } from './frontend.service'

const logger = createLoggerWithLabel(module)

/**
 * Handler for GET /frontend/datalayer endpoint.
 * @param req - Express request object
 * @param res - Express response object
 * @returns Templated Javascript code for the frontend to initialise Google Tag Manager
 */
export const addGoogleAnalyticsData: ControllerHandler<
  unknown,
  string | { message: string }
> = (req, res) => {
  const js = `
    window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '<%= GATrackingID%>', {
        'send_page_view': false,
        'app_name': '<%= appName%>',
        'cookie_flags': 'samesite=none;secure',
      });
    `
  try {
    const ejsRendered = ejs.render(js, req.app.locals)
    return res.type('text/javascript').status(StatusCodes.OK).send(ejsRendered)
  } catch (err) {
    logger.error({
      message: 'Error returning datalayer',
      meta: {
        action: 'datalayer',
        ...createReqMeta(req),
      },
      error: err,
    })
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'There was an unexpected error. Please refresh and try again.',
    })
  }
}

/**
 * @deprecated use object json returned from handleGetEnvironment instead
 * Handler for GET /frontend/environment endpoint.
 * @param req - Express request object
 * @param res - Express response object
 * @returns Templated Javascript code with environment variables for the frontend
 */
export const addEnvVarData: ControllerHandler<unknown, { message: string }> = (
  req,
  res,
) => {
  try {
    return res
      .type('text/javascript')
      .status(StatusCodes.OK)
      .send(req.app.locals.environment)
  } catch (err) {
    logger.error({
      message: 'Error returning environment',
      meta: {
        action: 'environment',
        ...createReqMeta(req),
      },
      error: err,
    })
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'There was an unexpected error. Please refresh and try again.',
    })
  }
}

/**
 * Handler for GET /frontend/env endpoint.
 * @returns the environment variables needed to hydrate the frontend.
 */
export const handleGetEnvironment: ControllerHandler<never, ClientEnvVars> = (
  _req,
  res,
) => {
  return res.json(getClientEnvVars())
}

/**
 * Handler for GET /frontend/redirect endpoint.
 * @param req - Express request object
 * @param res - Express response object
 * @returns Templated Javascript code for the frontend that redirects to specific form url
 */
export const generateRedirectUrl: ControllerHandler<
  unknown,
  string | { message: string },
  unknown,
  { redirectPath: string }
> = (req, res) => {
  const js = `
    // Update hash to match form id
    window.location.hash = "#!/<%= redirectPath%>"
    // Change url from form.gov.sg/123#!123 to form.gov.sg/#!/123
    window.history.replaceState("","", "/#!/<%= redirectPath%>")
  `
  // If there are multiple query params, '&' is html-encoded as '&amp;', which is not valid URI
  // Prefer to replace just '&' instead of using <%- to output unescaped values into the template
  // As this could potentially introduce security vulnerability
  // See https://ejs.co/#docs for tags
  try {
    const ejsRendered = ejs.render(js, req.query).replace(/&amp;/g, '&')
    return res.type('text/javascript').status(StatusCodes.OK).send(ejsRendered)
  } catch (err) {
    logger.error({
      message: 'Error returning redirectLayer',
      meta: {
        action: 'redirectlayer',
        ...createReqMeta(req),
      },
      error: err,
    })
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'There was an unexpected error. Please refresh and try again.',
    })
  }
}

// Duplicated here since the feature manager is being deprecated.
// TODO (#2147): delete this.
enum FeatureNames {
  Captcha = 'captcha',
  GoogleAnalytics = 'google-analytics',
  Sentry = 'sentry',
  Sms = 'sms',
  SpcpMyInfo = 'spcp-myinfo',
  VerifiedFields = 'verified-fields',
  WebhookVerifiedContent = 'webhook-verified-content',
}

/**
 * Handler for GET /frontend/features endpoint.
 * @param _req - Express request object
 * @param res - Express response object
 * @returns Current featureManager states
 * @deprecated as the feature manager has been deprecated. This endpoint
 * now hardcodes the feature states to support old clients.
 * TODO (#2147): delete this
 */
export const showFeaturesStates: ControllerHandler<
  unknown,
  Record<FeatureNames, boolean>
> = (_req, res) => {
  return res.json({
    [FeatureNames.Captcha]: true,
    [FeatureNames.Sms]: true,
    [FeatureNames.SpcpMyInfo]: true,
    [FeatureNames.VerifiedFields]: true,
    [FeatureNames.GoogleAnalytics]: true,
    [FeatureNames.WebhookVerifiedContent]: true,
    [FeatureNames.Sentry]: true,
  })
}
