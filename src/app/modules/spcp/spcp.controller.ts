import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { AuthType, IPopulatedForm } from '../../../types'
import { createReqMeta } from '../../utils/request'

import { SpcpFactory } from './spcp.factory'
import { LoginPageValidationResult } from './spcp.types'
import { extractJwt, mapRouteError } from './spcp.util'

const logger = createLoggerWithLabel(module)

// TODO (#42): remove these types when migrating away from middleware pattern
type WithForm<T> = T & {
  form: IPopulatedForm
}

/**
 * Generates redirect URL to Official SingPass/CorpPass log in page
 * @param req - Express request object
 * @param res - Express response object
 */
export const handleRedirect: RequestHandler<
  ParamsDictionary,
  { redirectURL: string } | { message: string },
  unknown,
  { authType: AuthType; target: string; esrvcId: string }
> = (req, res) => {
  const { target, authType, esrvcId } = req.query
  return SpcpFactory.createRedirectUrl(authType, target, esrvcId)
    .map((redirectURL) => {
      return res.status(StatusCodes.OK).json({ redirectURL })
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error while creating redirect URL',
        meta: {
          action: 'handleRedirect',
          ...createReqMeta(req),
          authType,
          target,
          esrvcId,
        },
        error,
      })
      const { statusCode, errorMessage } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * Validates the given e-service ID.
 * @param req - Express request object
 * @param res - Express response object
 */
export const handleValidate: RequestHandler<
  ParamsDictionary,
  LoginPageValidationResult | { message: string },
  unknown,
  { authType: AuthType; target: string; esrvcId: string }
> = (req, res) => {
  const { target, authType, esrvcId } = req.query
  return SpcpFactory.createRedirectUrl(authType, target, esrvcId)
    .asyncAndThen(SpcpFactory.fetchLoginPage)
    .andThen(SpcpFactory.validateLoginPage)
    .map((result) => res.status(StatusCodes.OK).json(result))
    .mapErr((error) => {
      logger.error({
        message: 'Error while validating e-service ID',
        meta: {
          action: 'handleValidate',
          ...createReqMeta(req),
          authType,
          target,
          esrvcId,
        },
        error,
      })
      const { statusCode, errorMessage } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * Adds session to returned JSON if form-filler is SPCP Authenticated
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export const addSpcpSessionInfo: RequestHandler<ParamsDictionary> = async (
  req,
  res,
  next,
) => {
  const { authType } = (req as WithForm<typeof req>).form
  if (!authType) return next()

  const jwt = extractJwt(req.cookies, authType)
  if (!jwt) return next()

  return SpcpFactory.extractPayload(jwt, authType)
    .map(({ userName }) => {
      res.locals.spcpSession = { userName }
      return next()
    })
    .mapErr((error) => {
      logger.error({
        message: 'Failed to verify JWT with auth client',
        meta: {
          action: 'addSpcpSessionInfo',
          ...createReqMeta(req),
        },
        error,
      })
      return next()
    })
}
