import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'

import { ProcessedFieldResponse } from '../submission.types'

import * as EmailSubmissionService from './email-submission.service'
import { WithEmailData } from './email-submission.types'

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
  ;(req as WithEmailData<typeof req>).autoReplyData = emailData.autoReplyData
  ;(req as WithEmailData<typeof req>).jsonData = emailData.jsonData
  ;(req as WithEmailData<typeof req>).formData = emailData.formData
  return next()
}
