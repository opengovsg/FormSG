import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import { rateLimitConfig } from '../../../../config/config'
import * as PublicFormController from '../../../../modules/form/public-form/public-form.controller'
import * as EmailSubmissionController from '../../../../modules/submission/email-submission/email-submission.controller'
import * as EmailSubmissionMiddleware from '../../../../modules/submission/email-submission/email-submission.middleware'
import * as EncryptSubmissionController from '../../../../modules/submission/encrypt-submission/encrypt-submission.controller'
import * as EncryptSubmissionMiddleware from '../../../../modules/submission/encrypt-submission/encrypt-submission.middleware'
import { CaptchaFactory } from '../../../../services/captcha/captcha.factory'
import { limitRate } from '../../../../utils/limit-rate'

export const PublicFormsRouter = Router()

/**
 * Send feedback for a public form
 * @route POST /:formId/feedback
 * @group forms - endpoints to serve forms
 * @param {string} formId.path.required - the form id
 * @param {Feedback.model} feedback.body.required - the user's feedback
 * @consumes application/json
 * @produces application/json
 * @returns 200 if feedback was successfully saved
 * @returns 400 if form feedback was malformed and hence cannot be saved
 * @returns 404 if form with formId does not exist or is private
 * @returns 410 if form has been archived
 * @returns 500 if database error occurs
 */
PublicFormsRouter.route('/:formId([a-fA-F0-9]{24})/feedback').post(
  celebrate({
    [Segments.BODY]: Joi.object()
      .keys({
        rating: Joi.number().min(1).max(5).cast('string').required(),
        comment: Joi.string().allow('').required(),
      })
      // Allow other keys for backwards compability as frontend might put
      // extra keys in the body.
      .unknown(true),
  }),
  PublicFormController.handleSubmitFeedback,
)

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
PublicFormsRouter.route('/:formId([a-fA-F0-9]{24})/submissions/email').post(
  limitRate({ max: rateLimitConfig.submissions }),
  CaptchaFactory.validateCaptchaParams,
  EmailSubmissionMiddleware.receiveEmailSubmission,
  EmailSubmissionMiddleware.validateResponseParams,
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
PublicFormsRouter.route('/:formId([a-fA-F0-9]{24})/submissions/encrypt').post(
  limitRate({ max: rateLimitConfig.submissions }),
  CaptchaFactory.validateCaptchaParams,
  EncryptSubmissionMiddleware.validateEncryptSubmissionParams,
  EncryptSubmissionController.handleEncryptedSubmission,
)

/**
 * Returns the specified form to the user, along with any
 * identify information obtained from Singpass/Corppass/MyInfo.
 *
 * WARNING: TemperatureSG batch jobs rely on this endpoint to
 * retrieve the master list of personnel for daily reporting.
 * Please strictly ensure backwards compatibility.
 * @route GET /:formId
 *
 * @returns 200 with form when form exists and is public
 * @returns 404 when form is private or form with given ID does not exist
 * @returns 410 when form is archived
 * @returns 500 when database error occurs
 */
PublicFormsRouter.get(
  '/:formId([a-fA-F0-9]{24})/',
  PublicFormController.handleGetPublicForm,
)
