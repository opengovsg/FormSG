import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

import { isUserInSession } from './auth.utils'

/**
 * Middleware that only allows authenticated users to pass through to the next
 * handler.
 * @returns next if user exists in session
 * @returns 401 if user does not exist in session
 */
export const withUserAuthentication: RequestHandler = (req, res, next) => {
  if (isUserInSession(req.session)) {
    return next()
  }

  return res
    .status(StatusCodes.UNAUTHORIZED)
    .json({ message: 'User is unauthorized.' })
}
