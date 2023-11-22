import { Router } from 'express'

import * as AuthSgidController from '../../../../modules/auth/sgid/auth-sgid.controller'
import { disabledOnPlayground } from '../../../../utils/disabled-on-playground'

export const AuthSGIDRouter = Router()

AuthSGIDRouter.get(
  '/authurl',
  disabledOnPlayground,
  AuthSgidController.generateAuthUrl,
)

/**
 * Receives the selected login details from Sgid
 * Sets the returned profiles in req.session.sgid
 * @route POST /api/v3/auth/sgid/login/callback
 *
 * The frontend should query the available profiles through GET /api/v3/auth/sgid/profiles
 *
 * @return 200 with redirect to frontend /login/callback if there are no errors
 * @return 400 when code or state is not provided, or state is incorrect
 * @return 500 when processing the code verifier cookie fails, or when an unknown error occurs
 */
AuthSGIDRouter.get('/login/callback', AuthSgidController.handleLoginCallback)

/**
 * Sets the selected user profile
 * Uses get request to retrieve available profiles
 * @route GET /api/v3/auth/sgid/profiles
 *
 * @return 200 with list of profiles
 * @return 400 when session or profile is invalid
 * @return 401 when session has expired
 */
AuthSGIDRouter.get('/profiles', AuthSgidController.getProfiles)

/**
 * Sets the selected user profile
 * Uses post request to select the workemail from the request body
 * @route POST /api/v3/auth/sgid/profiles
 *
 * @return 200 when OTP has been been successfully sent
 * @return 400 when session, profile, or workEmail is invalid
 * @return 401 when email domain is invalid
 * @return 500 when unknown errors occurs during email validation, or creating the new account
 */
AuthSGIDRouter.post('/profiles', AuthSgidController.setProfile)
