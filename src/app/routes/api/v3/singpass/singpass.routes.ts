import { Router } from 'express'

import { FormAuthType } from '../../../../../../shared/types'
import * as SpcpController from '../../../../modules/spcp/spcp.controller'
import { spcpOidcLoginParamsMiddleware } from '../../../../modules/spcp/spcp.middlewares'

// Handles SingPass OIDC requests
export const SingpassOidcRouter = Router()

/**
 * Handles form login after user has completed authentication on sp oidc
 * @param state callback state from singpass OIDC which contains formId, rememberMe, and encodedQuery
 * @param code authorisation code from singpass OIDC which is used to exchange for id token
 * @route GET /api/v3/singpass/login
 * @returns 302 redirects to form with sp jwt
 * @returns 400 if token exchange fails
 * @returns 400 if parse state fails
 * @returns 404 if form not found
 */
SingpassOidcRouter.get(
  '/login',
  spcpOidcLoginParamsMiddleware,
  SpcpController.handleSpcpOidcLogin(FormAuthType.SP),
)
