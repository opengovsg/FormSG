import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'

import { createLoggerWithLabel } from '../../../config/logger'
import { WithAutoReplyEmailData } from '../../../types'

import * as SubmissionService from './submission.service'
import { ProcessedFieldResponse } from './submission.types'

const logger = createLoggerWithLabel(module)

/**
 * Sends email confirmations to form-fillers, for email fields which have
 * email confirmation enabled.
 * @param req Express request object
 * @param res Express response object
 */
export const sendEmailConfirmations: RequestHandler<
  ParamsDictionary,
  unknown,
  { parsedResponses: ProcessedFieldResponse[] }
> = async (req, res) => {
  const {
    form,
    attachments,
    autoReplyData,
    submission,
  } = req as WithAutoReplyEmailData<typeof req>
  // Return the reply early to the submitter
  res.json({
    message: 'Form submission successful.',
    submissionId: submission.id,
  })
  return SubmissionService.sendEmailConfirmations({
    form,
    parsedResponses: req.body.parsedResponses,
    submission,
    attachments,
    autoReplyData,
  }).mapErr((error) => {
    logger.error({
      message: 'Error while sending email confirmations',
      meta: {
        action: 'sendEmailAutoReplies',
      },
      error,
    })
  })
}
