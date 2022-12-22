import axios from 'axios'
import { errors, isCelebrateError } from 'celebrate'
import { ErrorRequestHandler, RequestHandler } from 'express'
import { HttpError, isHttpError } from 'http-errors'
import { StatusCodes } from 'http-status-codes'
import get from 'lodash/get'
import { types } from 'util'

import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'

const logger = createLoggerWithLabel(module)
const celebrateErrorHandler = errors()

const isBodyParserError = (
  err: unknown,
): err is HttpError & { type: string } => {
  return isHttpError(err) && 'type' in err
}

const isHTTPLikeError = (
  err: unknown,
): err is Error & { statusCode: number } => {
  return types.isNativeError(err) && 'statusCode' in err
}

// If static no middleware responded
export const catchNonExistentStaticRoutesMiddleware: RequestHandler = async (
  req,
  res,
) => {
  // Attempt to fetch from s3 bucket

  try {
    const { data, status, headers } = await axios.get(
      `${config.aws.staticAssetsBucketUrl}${req.originalUrl}`,
      {
        responseType: 'stream',
      },
    )
    // If get request succeeds pipe the data back
    logger.info({
      message: 'Serving static asset from S3',
      meta: {
        action: 'catchNonExistentStaticRoutesMiddleware',
        url: req.originalUrl,
      },
    })
    res.status(status)
    res.set(headers)
    data.pipe(res)
  } catch (err) {
    // Else return 404
    logger.error({
      message: 'Static asset not found in S3',
      meta: {
        action: 'catchNonExistentStaticRoutesMiddleware',
        url: req.originalUrl,
      },
      // Log original error returned from s3
      error: err,
    })
    res.sendStatus(StatusCodes.NOT_FOUND)
  }
}

export const genericErrorHandlerMiddleware: ErrorRequestHandler = (
  err,
  req,
  res,
  next,
) => {
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

    const log_meta = {
      action: 'genericErrorHandlerMiddleware',
      // formId is only present for Joi validated routes that require it
      formId: get(req, 'form._id', null),
    }

    // Error page
    if (isCelebrateError(err)) {
      logger.error({
        message: 'Joi validation error',
        meta: {
          ...log_meta,
          details: Object.fromEntries(err.details),
        },
        error: err,
      })
      return celebrateErrorHandler(err, req, res, next)
    }

    if (isBodyParserError(err)) {
      logger.error({
        message: 'Body parser error',
        meta: {
          ...log_meta,
          details: {
            type: err.type,
            message: err.message,
          },
        },
        error: err,
      })
      if (err.expose) {
        return res
          .status(err.status)
          .json({ message: err.message ?? genericErrorMessage })
      }
      return res.status(err.status).json({ message: genericErrorMessage })
    }

    if (isHTTPLikeError(err)) {
      logger.error({
        message: `HTTP Error ${err.statusCode}`,
        meta: {
          ...log_meta,
          details: {
            message: err.message,
          },
        },
        error: err,
      })
      return res.status(err.statusCode).json({ message: err.message })
    }

    // Unknown errors
    logger.error({
      message: 'Unknown error',
      meta: {
        ...log_meta,
        details: {
          message: err.message,
        },
      },
      error: err,
    })
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: genericErrorMessage })
  }
}

export const errorHandlerMiddlewares = (): (
  | ErrorRequestHandler
  | RequestHandler
)[] => [genericErrorHandlerMiddleware, catchNonExistentStaticRoutesMiddleware]
