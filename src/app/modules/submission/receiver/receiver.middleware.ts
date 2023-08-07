import { Busboy } from 'busboy'
import { NextFunction, Request, Response } from 'express-serve-static-core'
import { Result } from 'neverthrow'

import { FieldResponse } from '../../../../../shared/types'
import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import { ControllerHandler } from '../../core/core.types'

import { InitialiseMultipartReceiverError } from './receiver.errors'
import * as SubmissionReceiver from './receiver.service'
import { mapRouteError } from './receiver.utils'

const logger = createLoggerWithLabel(module)

/**
 * Used for email mode only.
 * Parses multipart-form data request. Parsed attachments are
 * placed into req.attachments and parsed fields are placed into
 * req.body.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export const receiveEmailSubmission: ControllerHandler<
  unknown,
  { message: string },
  { responses: FieldResponse[] }
> = async (req, res, next) => {
  return receiveSubmission(
    req,
    res,
    next,
    SubmissionReceiver.createMultipartReceiver(req.headers, true),
  )
}

/**
 * Used for storage mode only.
 * Parses multipart-form data request. Parsed attachments are
 * placed into req.attachments and parsed fields are placed into
 * req.body.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export const receiveStorageSubmission: ControllerHandler<
  unknown,
  { message: string },
  { responses: FieldResponse[] }
> = async (req, res, next) => {
  return receiveSubmission(
    req,
    res,
    next,
    SubmissionReceiver.createMultipartReceiver(req.headers, false),
  )
}

const receiveSubmission = async (
  req: Request<
    unknown,
    { message: string },
    { responses: FieldResponse[] },
    unknown,
    Record<string, unknown>
  >,
  res: Response<{ message: string }, Record<string, unknown>, number>,
  next: NextFunction,
  multipartReceiver: Result<Busboy, InitialiseMultipartReceiverError>,
) => {
  const logMeta = {
    action: 'receiveSubmission',
    ...createReqMeta(req),
  }
  return multipartReceiver
    .asyncAndThen((receiver) => {
      const result = SubmissionReceiver.configureMultipartReceiver(receiver)
      req.pipe(receiver)
      return result
    })
    .map((parsed) => {
      req.body = parsed
      return next()
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error while receiving multipart data',
        meta: logMeta,
        error,
      })
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}
