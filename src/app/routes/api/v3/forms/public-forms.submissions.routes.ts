import { Router } from 'express'

import { rateLimitConfig } from '../../../../config/config'
import { injectFeedbackFormUrl } from '../../../../modules/form/public-form/public-form.middlewares'
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

/**
 * Submit a form response, submit a form response, and stores the encrypted
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

// TODO #4279: Remove after React rollout is complete
/**
 * Submit the bug report feedback form for React to Angular switch (public)
 */
PublicFormsSubmissionsRouter.route('/submissions/email/switchenvfeedback').post(
  limitRate({ max: rateLimitConfig.submissions }),
  injectFeedbackFormUrl,
  EmailSubmissionController.handleEmailSubmission,
)
