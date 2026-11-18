import { Router } from 'express'

import { rateLimitConfig } from '../../../../config/config'
import * as EncryptSubmissionController from '../../../../modules/submission/encrypt-submission/encrypt-submission.controller'
import * as MultirespondentSubmissionController from '../../../../modules/submission/multirespondent-submission/multirespondent-submission.controller'
import * as MrfStepAuthController from '../../../../modules/submission/multirespondent-submission/step-auth.controller'
import * as SubmissionController from '../../../../modules/submission/submission.controller'
import * as WogaaController from '../../../../modules/wogaa/wogaa.controller'
import { limitRate } from '../../../../utils/limit-rate'

import { authAndInjectFeedbackFormUrl } from './public-form.middleware'

export const PublicFormsSubmissionsRouter = Router()

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
  WogaaController.handleSubmit,
  EncryptSubmissionController.handleStorageSubmission,
)

/**
 * TODO: (Kill Email Mode) Remove this after kill email mode is fully implemented.
 */
PublicFormsSubmissionsRouter.route(
  '/submissions/storage/email-mode-feedback',
).post(
  limitRate({ max: rateLimitConfig.submissions }),
  authAndInjectFeedbackFormUrl,
  EncryptSubmissionController.handleStorageSubmission,
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
  '/:formId([a-fA-F0-9]{24})/submissions/multirespondent',
).post(
  limitRate({ max: rateLimitConfig.submissions }),
  WogaaController.handleSubmit,
  MultirespondentSubmissionController.handleMultirespondentSubmission,
)

/**
 * Retrieve actual response for a multirespondent mode form
 * @route GET /forms/:formId/submissions/:submissionId
 * @returns 200 with encrypted submission data response
 * @returns 400 when form is not an encrypt mode form
 * @returns 400 when Joi validation fails
 * @returns 404 when submissionId cannot be found in the database
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 500 when any errors occurs in database query or generating signed URL
 */
PublicFormsSubmissionsRouter.route(
  '/:formId([a-fA-F0-9]{24})/submissions/:submissionId([a-fA-F0-9]{24})',
)
  .get(
    MultirespondentSubmissionController.handleGetMultirespondentSubmissionForRespondent,
  )
  .put(
    limitRate({ max: rateLimitConfig.submissions }),
    MultirespondentSubmissionController.handleUpdateMultirespondentSubmission,
  )

/**
 * Login for the pending step of a multirespondent submission, using the
 * step's own saved login. The step token travels in the body, never the URL.
 * @route POST /forms/:formId/submissions/:submissionId/auth/redirect
 * @returns 200 with the provider redirect URL
 * @returns 400 when the step has no login or a Corppass step has no e-service ID
 * @returns 403 when the step token is invalid
 * @returns 409 when the submission is completed or rejected
 */
PublicFormsSubmissionsRouter.route(
  '/:formId([a-fA-F0-9]{24})/submissions/:submissionId([a-fA-F0-9]{24})/auth/redirect',
).post(
  limitRate({ max: rateLimitConfig.submissions }),
  MrfStepAuthController.handleMrfStepAuthRedirect,
)

/**
 * The pending step's login requirement and, once logged in, its session and
 * the fields that login prefills. Completes a MyInfo login bound to the step.
 * @route POST /forms/:formId/submissions/:submissionId/auth/session
 * @returns 200 with the step's login requirement and session
 * @returns 403 when the step token is invalid
 * @returns 409 when the submission is completed or rejected
 */
PublicFormsSubmissionsRouter.route(
  '/:formId([a-fA-F0-9]{24})/submissions/:submissionId([a-fA-F0-9]{24})/auth/session',
).post(
  limitRate({ max: rateLimitConfig.submissions }),
  MrfStepAuthController.handleMrfStepAuthSession,
)

/**
 * Logs out of the pending step of one multirespondent submission.
 * @route POST /forms/:formId/submissions/:submissionId/auth/logout
 * @returns 200 when logged out
 */
PublicFormsSubmissionsRouter.route(
  '/:formId([a-fA-F0-9]{24})/submissions/:submissionId([a-fA-F0-9]{24})/auth/logout',
).post(
  limitRate({ max: rateLimitConfig.submissions }),
  MrfStepAuthController.handleMrfStepAuthLogout,
)

/**
 * Get S3 presigned post data for attachments in a submission.
 * @route POST /forms/:formId/submissions/get-s3-presigned-post-data
 * @param response.body.required - contains field ids and sizes of attachments
 * @returns 200 - presigned post data generated
 * @returns 400 - ids are invalid or attachment size exceeds limit
 * @returns 500 - failed to generate presigned post data
 */
PublicFormsSubmissionsRouter.route(
  '/:formId([a-fA-F0-9]{24})/submissions/get-s3-presigned-post-data',
).post(
  limitRate({ max: rateLimitConfig.submissions }),
  SubmissionController.handleGetS3PresignedPostData,
)

/**
 * TODO(MRF/FRM-1601): Delete this route.
 * @deprecated
 * Get S3 presigned post data for attachments in a submission.
 * @route POST /forms/:formId/submissions/get-s3-presigned-post-data
 * @param response.body.required - contains field ids and sizes of attachments
 * @returns 200 - presigned post data generated
 * @returns 400 - ids are invalid or attachment size exceeds limit
 * @returns 500 - failed to generate presigned post data
 */
PublicFormsSubmissionsRouter.route(
  '/:formId([a-fA-F0-9]{24})/submissions/storage/get-s3-presigned-post-data',
).post(
  limitRate({ max: rateLimitConfig.submissions }),
  SubmissionController.handleGetS3PresignedPostData,
)
