import ejs from 'ejs'
import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

import featureManager from '../../config/feature-manager'
import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../utils/request'

const logger = createLoggerWithLabel(module)

/**
 * Handler for GET /frontend/datalayer endpoint.
 * @param req - Express request object
 * @param res - Express response object
 * @returns {String} Templated Javascript code for the frontend to initialise Google Tag Manager
 */
export const addGoogleAnalyticsData: RequestHandler<
  ParamsDictionary,
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
 * Handler for GET /frontend/environment endpoint.
 * @param req - Express request object
 * @param res - Express response object
 * @returns {String} Templated Javascript code with environment variables for the frontend
 */
export const addEnvVarData: RequestHandler<
  ParamsDictionary,
  { message: string }
> = (req, res) => {
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
 * Handler for GET /frontend/redirect endpoint.
 * @param req - Express request object
 * @param res - Express response object
 * @returns {String} Templated Javascript code for the frontend that redirects to specific form url
 */
export const generateRedirectUrl: RequestHandler<
  ParamsDictionary,
  string | { message: string }
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

/**
 * Handler for GET /frontend/features endpoint.
 * @param req - Express request object
 * @param res - Express response object
 * @returns {String} Current featureManager states
 */
export const showFeaturesStates: RequestHandler<
  ParamsDictionary,
  typeof featureManager.states
> = (req, res) => {
  return res.json(featureManager.states)
}
