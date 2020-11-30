import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'
import { merge } from 'lodash'

import { createLoggerWithLabel } from '../../../../config/logger'
import { FieldResponse, ResWithHashedFields, WithForm } from '../../../../types'
import { createReqMeta } from '../../../utils/request'
import { ConflictError } from '../submission.errors'
import { getProcessedResponses } from '../submission.service'
import { ProcessedFieldResponse } from '../submission.types'

import * as EmailSubmissionReceiver from './email-submission.receiver'
import * as EmailSubmissionService from './email-submission.service'
import { WithEmailData } from './email-submission.types'
import {
  mapAttachmentsFromResponses,
  mapRouteError,
} from './email-submission.util'

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
export const receiveEmailSubmission: RequestHandler<
  ParamsDictionary,
  { message: string }
> = async (req, res, next) => {
  const logMeta = {
    action: 'receiveEmailSubmission',
    formId: (req as WithForm<typeof req>).form._id,
    ...createReqMeta(req),
  }
  return EmailSubmissionReceiver.createMultipartReceiver(req.headers)
    .asyncAndThen((receiver) => {
      const result = EmailSubmissionReceiver.configureMultipartReceiver(
        receiver,
      )
      req.pipe(receiver)
      return result
    })
    .map((parsed) => {
      merge(req, parsed)
      const hashes = EmailSubmissionService.hashSubmission(parsed)
      logger.info({
        message: 'Submission successfully hashed',
        meta: { ...logMeta, ...hashes },
      })
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

/**
 * Extracts relevant fields, injects questions, verifies visibility of field and validates answers
 * to produce req.body.parsedResponses
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export const validateEmailSubmission: RequestHandler<
  ParamsDictionary,
  { message: string },
  { responses?: FieldResponse[]; parsedResponses: ProcessedFieldResponse[] }
> = async (req, res, next) => {
  const { form } = req as WithForm<typeof req>

  if (!req.body.responses) {
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }

  return EmailSubmissionService.validateAttachments(req.body.responses)
    .andThen(() => getProcessedResponses(form, req.body.responses!))
    .map((parsedResponses) => {
      // Creates an array of attachments from the validated responses
      merge(req, {
        attachments: mapAttachmentsFromResponses(req.body.responses!),
      })
      req.body.parsedResponses = parsedResponses
      delete req.body.responses // Prevent downstream functions from using responses by deleting it
      return next()
    })
    .mapErr((error) => {
      logger.error({
        message:
          error instanceof ConflictError
            ? 'Conflict - Form has been updated'
            : 'Error processing responses',
        meta: {
          action: 'validateEmailSubmission',
          ...createReqMeta(req),
          formId: form._id,
        },
        error,
      })
      if (error instanceof ConflictError) {
        return res.status(error.status).json({
          message:
            'The form has been updated. Please refresh and submit again.',
        })
      }
      return res.status(StatusCodes.BAD_REQUEST).json({
        message:
          'There is something wrong with your form submission. Please check your responses and try again. If the problem persists, please refresh the page.',
      })
    })
}
