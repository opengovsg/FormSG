import { Router } from 'express'

import { rateLimitConfig } from '../../../../config/config'
import { CaptchaFactory } from '../../../services/captcha/captcha.factory'
import { limitRate } from '../../../utils/limit-rate'

import { handleEmailSubmission } from './email-submission.controller'
import * as EmailSubmissionMiddleware from './email-submission.middleware'

export const EmailSubmissionRouter = Router()

/**
 * Submit a form response, processing it as an email to be sent to
 * the public servant who created the form. Optionally send a PDF
 * containing the submission back to the user, if an email address
 * was given. SMS autoreplies for mobile number fields are also sent if feature
 * is enabled.
 * Note that v2 endpoint no longer accepts body.captchaResponse
 * @route POST /v2/submissions/email/{formId}
 * @group forms - endpoints to serve forms
 * @param formId.path.required - the form id
 * @param response.body.required - contains the entire form submission
 * @param captchaResponse.query - contains the reCAPTCHA response artifact, if any
 * @consumes multipart/form-data
 * @produces application/json
 * @returns 200 - submission made
 * @returns 400 - submission has bad data and could not be processed
 */
EmailSubmissionRouter.post(
  '/:formId([a-fA-F0-9]{24})',
  limitRate({ max: rateLimitConfig.submissions }),
  CaptchaFactory.validateCaptchaParams,
  EmailSubmissionMiddleware.receiveEmailSubmission,
  EmailSubmissionMiddleware.validateResponseParams,
  handleEmailSubmission,
)
