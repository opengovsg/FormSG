import { Router } from 'express'

import * as SpcpController from './spcp.controller'
import { redirectParamsMiddleware } from './spcp.middlewares'
// Shared routes for Singpass and Corppass
export const SpcpRouter = Router()

/**
 * Provide a URL that web agents are obliged to redirect users to.
 * Due to cross-origin restrictions in place by SingPass/CorpPass,
 * this endpoint cannot and should not issue a 302 redirect
 * @route GET /spcp/redirect
 * @group SPCP - SingPass/CorpPass logins for form-fillers
 * @param target.query.required - the destination URL after login
 * @param authType.query.required - `SP` for SingPass or `CP` for CorpPass
 * @param esrvcId.query.required - e-service id
 * @produces application/json
 * @returns 200 - contains the URL to redirect to
 * @returns 400 - the redirect URL will be malformed due to missing parameters
 * @returns 500 - an error occurred while creating the URL
 */
SpcpRouter.get(
  '/redirect',
  redirectParamsMiddleware,
  SpcpController.handleRedirect,
)

/**
 * Gets the spcp redirect URL and parses the returned page to check for error codes
 * @route GET /spcp/validate
 * @group SPCP - SingPass/CorpPass logins for form-fillers
 * @param {string} target.query.required - the destination URL after login
 * @param {string} authType.query.required - `SP` for SingPass or `CP` for CorpPass
 * @param {string} esrvcId.query.required - e-service id
 * @produces application/json
 * @returns {Object} 200 - {isValid: boolean, errorCode?: string}
 * where isValid is true if eservice id was valid, and otherwise false with the errorCode set to
 * the error code returned by SingPass/CorpPass
 * @returns {string} 503 - error message if the SP/CP server could not be contacted to retrieve the login page
 * @returns {string} 502 - error message if the SP/CP server returned content which could not be parsed
 */
SpcpRouter.get(
  '/validate',
  redirectParamsMiddleware,
  SpcpController.handleValidate,
)
