import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import { AuthType } from '../../../types'

import { SpcpFactory } from './spcp.factory'
import { mapRouteError } from './spcp.util'

const logger = createLoggerWithLabel(module)

export const handleRedirect: RequestHandler<
  unknown,
  unknown,
  unknown,
  { authType: AuthType; target: string; esrvcId: string }
> = (req, res) => {
  const { target, authType, esrvcId } = req.query
  SpcpFactory.createRedirectUrl(authType, target, esrvcId)
    .map((redirectURL) => {
      return res.status(StatusCodes.OK).json({ redirectURL })
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error while creating redirect URL',
        meta: {
          action: 'handleRedirect',
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
