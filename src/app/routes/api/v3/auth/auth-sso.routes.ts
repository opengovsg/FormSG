import { Router } from 'express'

import * as AuthSsoController from '../../../../modules/auth/sso/auth-sso.controller'

export const AuthSsoRouter = Router()

AuthSsoRouter.get('/login', AuthSsoController.login)

/**
 * Receives the selected login details from SSO
 * Sets the returned profiles in req.session.sso
 * @route POST /api/v3/auth/sso/login/callback
 *
 * @return 200 with redirect to frontend /login/callback if there are no errors
 * @return 400 when code or state is not provided, or state is incorrect
 * @return 500 when processing the code verifier cookie fails, or when an unknown error occurs
 */
AuthSsoRouter.get('/login/callback', AuthSsoController.handleLoginCallback)
