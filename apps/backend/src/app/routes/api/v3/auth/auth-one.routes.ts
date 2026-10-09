import { Router } from 'express'

import { authCallbackForwardingMiddleware } from '../../../../modules/auth/auth.middlewares'
import * as AuthOneController from '../../../../modules/auth/one/auth-one.controller'

export const AuthOneRouter = Router()

/**
 * Starts the one.gov.sg Authorization Code + PKCE flow and 302s to the IdP.
 * Also reached from the frontend /login page, which is this RP's
 * `initiate_login_uri`: it forwards the launcher's `?iss=` param here.
 * @route GET /api/v3/auth/one/login
 */
AuthOneRouter.get('/login', AuthOneController.handleLogin)

/**
 * Receives the authorization code from one.gov.sg, exchanges it for tokens
 * and opens a FormSG session.
 *
 * On GSIB, Menlo isolates one.gov.sg, so its remote browser follows the IdP's
 * redirect here without the PKCE/state cookies set in the officer's own
 * browser. The forwarding middleware bounces RBI-proxy requests through the
 * frontend /login/forward page so the officer's browser makes the call.
 * @route GET /api/v3/auth/one/login/callback
 *
 * @return 302 to frontend /login/one holding page with a status query param
 */
AuthOneRouter.get(
  '/login/callback',
  authCallbackForwardingMiddleware,
  AuthOneController.handleLoginCallback,
)
