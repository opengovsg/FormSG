import { StatusCodes } from 'http-status-codes'

import { ControllerHandler } from '../core/core.types'
import * as UserService from '../user/user.service'

import { isUserInSession } from './auth.utils'

/**
 * Middleware that only allows authenticated users to pass through to the next
 * handler.
 * @returns next if user exists in session
 * @returns 401 if user does not exist in session
 */
export const withUserAuthentication: ControllerHandler = (req, res, next) => {
  if (isUserInSession(req.session)) {
    return next()
  }

  return res
    .status(StatusCodes.UNAUTHORIZED)
    .json({ message: 'User is unauthorized.' })
}

const DENIED_DOMAINS = ['myrp.edu.sg', 'ichat.sp.edu.sg']

/**
 * If user is from a domain which should not have been whitelisted,
 * do not allow any updates. Only allow GET requests, eg to access
 * submissions.
 * @returns 400 if user in session is from a disallowed domain and
 * HTTP method changes database state; next otherwise
 */
export const denyRpSpStudentEmails: ControllerHandler<
  unknown,
  unknown,
  unknown
> = async (req, res, next) => {
  const userId = (req.session as Express.AuthedSession).user._id
  return UserService.findUserById(userId)
    .map((user) => {
      const emailDomain = user.email.split('@').pop() ?? ''
      if (
        DENIED_DOMAINS.includes(emailDomain.toLowerCase()) &&
        req.method.toLowerCase() !== 'get'
      ) {
        return res.sendStatus(StatusCodes.BAD_REQUEST)
      }
      return next()
    })
    .mapErr(() =>
      res
        .status(StatusCodes.UNPROCESSABLE_ENTITY)
        .json({ message: 'User not found' }),
    )
}
