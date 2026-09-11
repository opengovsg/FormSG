import { Router } from 'express'

import * as AuthOneController from '../../../../modules/auth/one/auth-one.controller'

export const AuthOneRouter = Router()

/**
 * Starts the one.gov.sg Authorization Code + PKCE flow and 302s to the IdP.
 * Also serves as this RP's `initiate_login_uri` for IdP-initiated logins
 * (the one.gov.sg app launcher deep-links here with an `?iss=` param).
 * @route GET /api/v3/auth/one/login
 */
AuthOneRouter.get('/login', AuthOneController.handleLogin)

/**
 * Receives the authorization code from one.gov.sg, exchanges it for tokens
 * and opens a FormSG session.
 * @route GET /api/v3/auth/one/login/callback
 *
 * @return 302 to frontend /login/one holding page with a status query param
 */
AuthOneRouter.get('/login/callback', AuthOneController.handleLoginCallback)
