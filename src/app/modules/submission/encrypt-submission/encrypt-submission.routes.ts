import { Router } from 'express'

import { rateLimitConfig } from '../../../../config/config'
import { CaptchaFactory } from '../../../services/captcha/captcha.factory'
import { limitRate } from '../../../utils/limit-rate'

import * as EncryptSubmissionController from './encrypt-submission.controller'
import * as EncryptSubmissionMiddleware from './encrypt-submission.middleware'

export const EncryptSubmissionRouter = Router()

/**
 * Submit a form response, submit a form response, and stores the encrypted
 * contents.
 * Optionally, an autoreply confirming submission is sent back to the user, if
 * an email address was given. SMS autoreplies for mobile number fields are also
 * sent if the feature is enabled.
 * @route POST /v2/submissions/encrypt/:formId
 * @param response.body.required - contains the entire form submission
 * @param captchaResponse.query - contains the reCAPTCHA response artifact, if any
 * @returns 200 - submission made
 * @returns 400 - submission has bad data and could not be processed
 */
EncryptSubmissionRouter.post(
  '/:formId([a-fA-F0-9]{24})',
  limitRate({ max: rateLimitConfig.submissions }),
  CaptchaFactory.validateCaptchaParams,
  EncryptSubmissionMiddleware.validateEncryptSubmissionParams,
  EncryptSubmissionController.handleEncryptedSubmission,
)
