import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { merge } from 'lodash'

import { ProcessedFieldResponse } from '../submission.types'

import * as EmailSubmissionService from './email-submission.service'

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
  const hashedFields = res.locals.hashedFields || new Set()
  const emailData = EmailSubmissionService.createEmailData(
    req.body.parsedResponses,
    hashedFields,
  )
  merge(req, emailData)
  return next()
}
