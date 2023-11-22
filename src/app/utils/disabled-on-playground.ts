import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../config/logger'
import { ControllerHandler } from '../modules/core/core.types'

import { createReqMeta } from './request'

const logger = createLoggerWithLabel(module)

/**
 * Returns a middleware that returns a 403 Forbidden response when accessed
 * Used when an API should be disabled on playground
 * @return 403 Forbidden response
 */
export const disabledOnPlayground: ControllerHandler = (req, res) => {
  logger.warn({
    message: 'Accessing disabled feature',
    meta: {
      action: 'disabledOnPlayground',
      ...createReqMeta(req),
      method: req.method,
    },
  })
  return res.status(StatusCodes.FORBIDDEN).json({
    message: 'Feature is not available on playground.',
  })
}
