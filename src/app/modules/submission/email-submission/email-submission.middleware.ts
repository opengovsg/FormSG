import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { merge } from 'lodash'

import { createLoggerWithLabel } from '../../../../config/logger'
import { ResWithHashedFields } from '../../../../types'
import { ProcessedFieldResponse } from '../submission.types'

import * as EmailSubmissionReceiver from './email-submission.receiver'
import * as EmailSubmissionService from './email-submission.service'
import { WithEmailData } from './email-submission.types'

const logger = createLoggerWithLabel(module)

/**
 * Construct autoReply data and data to send admin from responses submitted
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export const prepareEmailSubmission: RequestHandler<
  ParamsDictionary,
  unknown,
  { parsedResponses: ProcessedFieldResponse[] }
> = (req, res, next) => {
  const hashedFields =
    (res as ResWithHashedFields<typeof res>).locals.hashedFields || new Set()
  const emailData = EmailSubmissionService.createEmailData(
    req.body.parsedResponses,
    hashedFields,
  )
  ;(req as WithEmailData<typeof req>).autoReplyData = emailData.autoReplyData
  ;(req as WithEmailData<typeof req>).jsonData = emailData.jsonData
  ;(req as WithEmailData<typeof req>).formData = emailData.formData
  return next()
}

/**
 * Parses multipart-form data request. Parsed attachments are
 * placed into req.attachments and parsed fields are placed into
 * req.body.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export const receiveEmailSubmission: RequestHandler = (req, res, next) => {
  EmailSubmissionReceiver.createMultipartReceiver(req.headers)
    .map((receiver) => {
      // Configuration is event-based so we have to use a callback
      EmailSubmissionReceiver.configureMultipartReceiver(receiver, (result) => {
        result
          .map((parsed) => {
            merge(req, parsed)
            return next()
          })
          .mapErr((error) => {
            logger.error({
              message: 'Error while receiving multipart data',
              meta: {
                action: 'receiveEmailSubmission',
              },
              error,
            })
            // const { errorMessage, statusCode } = mapRouteError(error)
            // return res.status(statusCode).json({ message: errorMessage })
          })
      })
      req.pipe(receiver)
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error while receiving multipart data',
        meta: {
          action: 'receiveEmailSubmission',
        },
        error,
      })
      // const { errorMessage, statusCode } = mapRouteError(error)
      // return res.status(statusCode).json({ message: errorMessage })
    })
}
