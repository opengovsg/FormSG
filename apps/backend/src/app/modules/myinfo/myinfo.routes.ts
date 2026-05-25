import { Router } from 'express'

import { authCallbackForwardingMiddleware } from '../auth/auth.middlewares'

import { handleMyInfoV5Login, handleV5Jwks } from './v5/myinfo.v5.controller'
import {
  MYINFO_REDIRECT_PATH,
  MYINFO_V5_JWKS_PATH,
  MYINFO_V5_REDIRECT_PATH,
} from './myinfo.constants'
import {
  handleMyInfoLogin,
  handleRedirectURLRequest,
} from './myinfo.controller'

export const MyInfoRouter = Router()

/**
 * Serves requests to supply a redirect URL to log in to
 * MyInfo.
 * @deprecated in favour of GET /api/v3/forms/:formId/auth/redirect
 */
MyInfoRouter.get('/redirect', handleRedirectURLRequest)

/**
 * Serves redirects from MyInfo after user has given consent to provide
 * their MyInfo data.
 */
MyInfoRouter.get(
  MYINFO_REDIRECT_PATH,
  authCallbackForwardingMiddleware,
  handleMyInfoLogin,
)

/**
 * v5 — Singpass Auth API v5 / MyInfo v5.
 * Mounted alongside v3 so flag-gated traffic can route here without affecting
 * v3 forms. Path is registered as a separate redirect URI with Singpass.
 */
MyInfoRouter.get(
  MYINFO_V5_REDIRECT_PATH,
  authCallbackForwardingMiddleware,
  handleMyInfoV5Login,
)

/**
 * Public RP JWKS used by the Singpass IdP to verify our client_assertion and
 * encrypt the userinfo JWE.
 */
MyInfoRouter.get(MYINFO_V5_JWKS_PATH, handleV5Jwks)
