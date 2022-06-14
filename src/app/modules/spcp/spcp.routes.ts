import { Router } from 'express'

import { FormAuthType } from '../../../../shared/types'

import * as SpcpController from './spcp.controller'
import {
  loginParamsMiddleware,
  redirectParamsMiddleware,
} from './spcp.middlewares'
// Shared routes for Singpass and Corppass
export const SpcpRouter = Router()

/**
 * Provide a URL that web agents are obliged to redirect users to.
 * Due to cross-origin restrictions in place by SingPass/CorpPass,
 * this endpoint cannot and should not issue a 302 redirect
 * @deprecated in favour of GET /api/v3/forms/:formId/auth/redirect
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
 * @deprecated in favour of POST /api/v3/forms/:formId/auth/validate
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

// Handles SingPass login requests
export const SingpassLoginRouter = Router()

/**
 * Receive a SAML artifact and target destination from SingPass, and
 * issue a 302 redirect on successful artifact verification
 * @route GET /singpass/login
 * @group SPCP - SingPass/CorpPass logins for form-fillers
 * @param SAMLart.query.required - the SAML artifact
 * @param RelayState.query.required - the relative destination URL after login,
 * @returns 302 - redirects the user to the specified relay state
 * @returns 400 - received on a bad SAML artifact, or bad relay state
 * @returns 404 - destination form in relay state could not be found
 * @headers {string} 302.jwtSp - contains the session cookie upon login
 * @headers {string} 302.isLoginError - true if we fail to obtain the user's identity
 */
SingpassLoginRouter.get(
  '/',
  loginParamsMiddleware,
  SpcpController.handleLogin(FormAuthType.SP),
)

// Handles CorpPass login requests
export const CorppassLoginRouter = Router()

/**
 * Receive a SAML artifact and target destination from CorpPass, and
 * issue a 302 redirect on successful artifact verification
 * @route GET /corppass/login
 * @group SPCP - SingPass/CorpPass logins for form-fillers
 * @param SAMLart.query.required - the SAML artifact
 * @param RelayState.query.required - the relative destination URL after login,
 * @returns 302 - redirects the user to the specified relay state
 * @returns 400 - received on a bad SAML artifact, or bad relay state
 * @returns 404 - destination form in relay state could not be found
 * @headers {string} 302.jwtCp - contains the session cookie upon login
 * @headers {string} 302.isLoginError - true if we fail to obtain the user's identity
 */
CorppassLoginRouter.get(
  '/',
  loginParamsMiddleware,
  SpcpController.handleLogin(FormAuthType.CP),
)

// Handles SingPass JWKS requests
export const SpOidcJwksRouter = Router()

/**
 * Returns the RP's public json web key set (JWKS) for communication with NDI
 * @route GET /singpass/.well-known/jwks.json
 * @returns 200
 */

SpOidcJwksRouter.get('/', SpcpController.handleGetWellKnown)
