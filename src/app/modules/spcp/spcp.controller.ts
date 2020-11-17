import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { AuthType } from '../../../types'
import { createReqMeta } from '../../utils/request'

import { SpcpFactory } from './spcp.factory'
import { mapRouteError } from './spcp.util'

const logger = createLoggerWithLabel(module)

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
  | { isValid: true }
  | { isValid: false; errorCode: string }
  | { message: string },
  unknown,
  { authType: AuthType; target: string; esrvcId: string }
> = (req, res) => {
  const { target, authType, esrvcId } = req.query
  return SpcpFactory.createRedirectUrl(authType, target, esrvcId)
    .asyncAndThen(SpcpFactory.fetchLoginPage)
    .andThen(SpcpFactory.validateLoginPage)
    .map((errorCode) => {
      if (!errorCode) {
        return res.status(StatusCodes.OK).json({ isValid: true })
      } else {
        return res.status(StatusCodes.OK).json({ isValid: false, errorCode })
      }
    })
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
