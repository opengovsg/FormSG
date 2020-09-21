import { isCelebrateError, Segments } from 'celebrate'
import { ErrorRequestHandler, RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'
import get from 'lodash/get'

import { createLoggerWithLabel } from '../../config/logger'

const logger = createLoggerWithLabel(module)

const errorHandlerMiddlewares = (): (
  | ErrorRequestHandler
  | RequestHandler
)[] => {
  // Assume 'not found' in the error msgs is a 404. this is somewhat silly, but valid, you can do whatever you like, set properties, use instanceof etc.
  const genericErrorHandlerMiddleware: ErrorRequestHandler = function (
    err,
    req,
    res,
    next,
  ) {
    // If headers have already been sent, don't send again
    if (res.headersSent) {
      return
    }

    // If the error object doesn't exists
    if (!err) {
      return next()
    } else {
      const genericErrorMessage =
        'Apologies, something odd happened. Please try again later!'
      // Error page
      if (isCelebrateError(err)) {
        logger.error({
          message: 'Joi validation error',
          meta: {
            action: 'genericErrorHandlerMiddleware',
            // formId is only present for Joi validated routes that require it
            formId: get(req, 'form._id', null),
          },
          error: err,
        })
        return res
          .status(StatusCodes.BAD_REQUEST)
          .send('Some required parameters are missing')
      }

      logger.error({
        message: 'Unknown error',
        meta: {
          action: 'genericErrorHandlerMiddleware',
        },
        error: err,
      })
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send({ message: genericErrorMessage })
    }
  }

  // Assume 404 since no middleware responded
  const catchNonExistentRoutesMiddleware: RequestHandler = function (
    _req,
    res,
  ) {
    res.status(StatusCodes.NOT_FOUND).send()
  }

  return [genericErrorHandlerMiddleware, catchNonExistentRoutesMiddleware]
}

export default errorHandlerMiddlewares
