import { Router } from 'express'

import * as AuthWogadController from '../../../../modules/auth/wogad/auth-wogad.controller'

export const AuthWogadRouter = Router()

/**
 * Generates the WOG AD Authorization URL.
 * The browser redirects to WOG AD and completes the authentication challenge.
 * Then, WOG AD will redirect the browser to the registered redirect URL with the auth code and csrf token (stored in state).
 * @route GET /api/v3/auth/wogad/authUrl
 *
 * @return 200 with the WOG AD Authorization URL
 */
AuthWogadRouter.get('/authUrl', AuthWogadController.generateAuthUrl)

/**
 * Retrieves the selected login details from WOG AD directory after verifying the auth code and csrf token.
 * Sets the returned user information in req.session.user.
 * @route POST /api/v3/auth/wogad/verify
 *
 * @return 200 with the user information if successful
 * @return 403 when code or csrf token is invalid, or the user is not whitelisted.
 * @return 404 when the user is not found in WOG AD directory.
 * @return 500 when session cannot be found or when user cannot be loaded.
 */
AuthWogadRouter.post('/verify', AuthWogadController.handleVerifyWithCode)

/**
 * Get the logout URL for the WOG AD.
 * @route GET /api/v3/auth/wogad/logoutUrl
 *
 * @return 200 with the logout URL for the WOG AD.
 */
AuthWogadRouter.get('/logoutUrl', AuthWogadController.getLogoutUrl)
