import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { getRequestIp } from '../../utils/request'
import { ApplicationError, DatabaseError } from '../core/core.errors'

import { InvalidDomainError } from './auth.errors'
import * as AuthService from './auth.service'

const logger = createLoggerWithLabel(module)

const mapRouteError = (error: ApplicationError) => {
  switch (error.constructor) {
    case InvalidDomainError:
      return {
        statusCode: StatusCodes.UNAUTHORIZED,
        errorMessage: error.message,
      }
    case DatabaseError:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: error.message,
      }
    default:
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        errorMessage: 'Something went wrong. Please try again.',
      }
  }
}

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
    const { errorMessage, statusCode } = mapRouteError(error)
    return res.status(statusCode).send(errorMessage)
  }
  // Pass down agency to next handler.
  res.locals.agency = validateResult.value

  return next()
}
