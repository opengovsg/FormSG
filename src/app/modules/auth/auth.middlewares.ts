import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'

import { createLoggerWithLabel } from '../../../config/logger'
import { getRequestIp } from '../../utils/request'

import * as AuthService from './auth.service'

const logger = createLoggerWithLabel(module)

/**
 * Middleware to check if domain of email in the body is from a whitelisted
 * agency.
 * @returns 500 when there was an error validating email
 * @returns 401 when email domain is invalid
 * @returns sets retrieved agency in `res.locals.agency` and calls next when domain is valid
 */
export const validateDomain: RequestHandler<
  ParamsDictionary,
  string,
  { email: string }
> = async (req, res, next) => {
  // Joi validation ensures existence.
  const { email } = req.body

  const validateResult = await AuthService.validateEmailDomain(email)

  if (validateResult.isErr()) {
    const { error } = validateResult
    logger.error({
      message: 'Domain validation error',
      meta: {
        action: 'validateDomain',
        ip: getRequestIp(req),
        email,
      },
      error,
    })
    return res.status(error.status).send(error.message)
  }

  // Pass down agency to next handler.
  res.locals.agency = validateResult.value

  return next()
}
