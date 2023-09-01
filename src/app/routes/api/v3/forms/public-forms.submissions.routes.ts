import { Router } from 'express'

import { rateLimitConfig } from '../../../../config/config'
import * as EmailSubmissionController from '../../../../modules/submission/email-submission/email-submission.controller'
import * as EncryptSubmissionController from '../../../../modules/submission/encrypt-submission/encrypt-submission.controller'
import { limitRate } from '../../../../utils/limit-rate'

export const PublicFormsSubmissionsRouter = Router()

/**
 * Submit a form response, processing it as an email to be sent to
 * the public servant who created the form. Optionally send a PDF
 * containing the submission back to the user, if an email address
 * was given. SMS autoreplies for mobile number fields are also sent if feature
 * is enabled.
 * @route POST /:formId/submissions/email
 * @group forms - endpoints to serve forms
 * @param formId.path.required - the form id
 * @param response.body.required - contains the entire form submission
 * @param captchaResponse.query - contains the reCAPTCHA response artifact, if any
 * @consumes multipart/form-data
 * @produces application/json
 * @returns 200 - submission made
 * @returns 400 - submission has bad data and could not be processed
 */
PublicFormsSubmissionsRouter.route(
  '/:formId([a-fA-F0-9]{24})/submissions/email',
).post(
  limitRate({ max: rateLimitConfig.submissions }),
  EmailSubmissionController.handleEmailSubmission,
)

// TODO (FRM-1232): remove endpoint after encryption boundary is shifted
/**
 * Submit a form response, validate submission params and stores the encrypted
 * contents.
 * Optionally, an autoreply confirming submission is sent back to the user, if
 * an email address was given. SMS autoreplies for mobile number fields are also
 * sent if the feature is enabled.
 * @route POST /forms/:formId/submissions/encrypt
 * @param response.body.required - contains the entire form submission
 * @param captchaResponse.query - contains the reCAPTCHA response artifact, if any
 * @returns 200 - submission made
 * @returns 400 - submission has bad data and could not be processed
 */
PublicFormsSubmissionsRouter.route(
  '/:formId([a-fA-F0-9]{24})/submissions/encrypt',
).post(
  limitRate({ max: rateLimitConfig.submissions }),
  EncryptSubmissionController.handleEncryptedSubmission,
)

/**
 * Submit a form response before public key encryption, performs pre-encryption
 * steps (e.g. field validation, virus scanning) and stores the encrypted contents.
 * @route POST /forms/:formId/submissions/storage
 * @param response.body.required - contains the entire form submission
 * @param captchaResponse.query - contains the reCAPTCHA response artifact, if any
 * @returns 200 - submission made
 * @returns 400 - submission has bad data and could not be processed
 */
PublicFormsSubmissionsRouter.route(
  '/:formId([a-fA-F0-9]{24})/submissions/storage',
).post(
  limitRate({ max: rateLimitConfig.submissions }),
  EncryptSubmissionController.handleStorageSubmission,
)

PublicFormsSubmissionsRouter.route(
  '/:formId([a-fA-F0-9]{24})/submissions/storage/attachments',
).post(
  limitRate({ max: rateLimitConfig.submissions }),
  EncryptSubmissionController.handleGetS3PresignedUrl,
)
