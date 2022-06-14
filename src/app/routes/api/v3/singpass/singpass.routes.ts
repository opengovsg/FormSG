import { Router } from 'express'

import * as SpcpController from '../../../../modules/spcp/spcp.controller'
import { spOidcLoginParamsMiddleware } from '../../../../modules/spcp/spcp.middlewares'

// Handles SingPass OIDC requests
export const SingpassOidcRouter = Router()

/**
 * Handles form login after user has completed authentication on sp oidc
 * @param state callback state from singpass OIDC which contains formId, rememberMe, and encodedQuery
 * @param code authorisation code from singpass OIDC which is used to exchange for id token
 * @route GET /api/v3/singpass/login
 * @returns 200
 */
SingpassOidcRouter.get(
  '/login',
  spOidcLoginParamsMiddleware,
  SpcpController.handleSpOidcLogin,
)
