import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

import { isUserInSession } from './auth.utils'

export const withUserAuthentication: RequestHandler = (req, res, next) => {
  if (isUserInSession(req.session)) {
    return next()
  }

  return res
    .status(StatusCodes.UNAUTHORIZED)
    .json({ message: 'User is unauthorized.' })
}
