import { Router } from 'express'

import * as AuthSgidController from '../../../../modules/auth/sgid/auth-sgid.controller'

export const AuthSGIDRouter = Router()

AuthSGIDRouter.get('/authurl', AuthSgidController.generateAuthUrl)

/**
 * Receives the selected login details from Sgid
 * Sets the returned profiles in req.session.sgid
 * @route POST /sgid/auth/login/callback
 *
 * The frontend should query the available profiles through GET /sgid/auth/profiles
 *
 * @returns 200 with redirect to frontend /login/callback if there are no errors
 */
AuthSGIDRouter.get('/login/callback', AuthSgidController.handleLoginCallback)

/**
 * Sets the selected user profile
 * Uses post request to select the workemail from the request body
 * @route POST /sgid/auth/profile
 *
 * @returns 200 with redirect to /dashboard if workemail is valid
 * @returns 500 when database error occurs
 */
AuthSGIDRouter.get('/profiles', AuthSgidController.getProfiles)

/**
 * Sets the selected user profile
 * Uses post request to select the workemail from the request body
 * @route POST /sgid/auth/profile
 *
 * @returns 200 with redirect to /dashboard if workemail is valid
 * @returns 500 when database error occurs
 */
AuthSGIDRouter.post('/profile', AuthSgidController.setProfile)
