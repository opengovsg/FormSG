import to from 'await-to-js'
import { RequestHandler } from 'express'
import HttpStatus from 'http-status-codes'

import defaults from '../../../config/defaults'
import { createLoggerWithLabel } from '../../../config/logger'
import { getRequestIp } from '../../utils/request'

import { InvalidDomainError } from './auth.errors'
import * as AuthService from './auth.service'

const logger = createLoggerWithLabel('auth.controller')

export const handleCheckUser: RequestHandler<
  {},
  {},
  { email: string }
> = async (req, res) => {
  // Joi validation ensures existence.
  const { email } = req.body

  const [validationError] = await to(AuthService.validateDomain(email))

  if (validationError) {
    logger.error({
      message: 'Domain validation error',
      meta: {
        action: 'handleCheckUser',
        ip: getRequestIp(req),
        email,
      },
      error: validationError,
    })
    if (validationError instanceof InvalidDomainError) {
      return res.status(validationError.status).send(validationError.message)
    }
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(
        `Unable to validate email domain. If this issue persists, please submit a Support Form at (${defaults.links.supportFormLink}).`,
      )
  }

  // No error.
  return res.sendStatus(HttpStatus.OK)
}
