import to from 'await-to-js'
import { RequestHandler } from 'express'
import HttpStatus from 'http-status-codes'

import defaults from '../../../config/defaults'
import { createLoggerWithLabel } from '../../../config/logger'
import { getRequestIp } from '../../utils/request'
import { ApplicationError } from '../core/core.errors'

import * as AuthService from './auth.service'

const logger = createLoggerWithLabel(module)

/**
 * Middleware to check if domain of email in the body is from a whitelisted
 * agency.
 * @return 500 when there was an error validating email
 * @return 401 when email domain is invalid
 * @returns calls next when domain is valid
 */
export const validateDomain: RequestHandler<{}, {}, { email: string }> = async (
  req,
  res,
  next,
) => {
  // Joi validation ensures existence.
  const { email } = req.body

  const [validationError] = await to(AuthService.getAgencyWithEmail(email))

  if (validationError) {
    logger.error({
      message: 'Domain validation error',
      meta: {
        action: 'validateDomain',
        ip: getRequestIp(req),
        email,
      },
      error: validationError,
    })
    if (validationError instanceof ApplicationError) {
      return res.status(validationError.status).send(validationError.message)
    }
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(
        `Unable to validate email domain. If this issue persists, please submit a Support Form at (${defaults.links.supportFormLink}).`,
      )
  }

  return next()
}
