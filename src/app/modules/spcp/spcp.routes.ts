import { Router } from 'express'

import { FormAuthType } from '../../../../shared/types'

import * as SpcpController from './spcp.controller'
import { loginParamsMiddleware } from './spcp.middlewares'

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
