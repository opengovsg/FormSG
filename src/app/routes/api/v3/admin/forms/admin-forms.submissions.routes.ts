import { Router } from 'express'

import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'
import * as EncryptSubmissionController from '../../../../../modules/submission/encrypt-submission/encrypt-submission.controller'

export const AdminFormsSubmissionsRouter = Router()

/**
 * Count the number of submissions for a form
 * @route GET /:formId/submissions/count
 * @security session
 *
 * @returns 200 with submission counts of given form
 * @returns 400 when query.startDate or query.endDate is malformed
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsSubmissionsRouter.route(
  '/:formId([a-fA-F0-9]{24})/submissions/count',
).get(AdminFormController.handleCountFormSubmissions)

/**
 * Stream download all encrypted responses for a form
 * @route GET /:formId/submissions/download
 * @security session
 *
 * @returns 200 with stream of encrypted responses
 * @returns 400 if form is not an encrypt mode form
 * @returns 400 when Joi validation fails
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have read permissions for form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 if any errors occurs in stream pipeline or error retrieving form
 */
AdminFormsSubmissionsRouter.route(
  '/:formId([a-fA-F0-9]{24})/submissions/download',
).get(EncryptSubmissionController.handleStreamEncryptedResponses)

/**
 * Retrieve actual response for a storage mode form
 * @route GET /:formId/submissions/:submissionId
 * @security session
 *
 * @returns 200 with encrypted submission data response
 * @returns 400 when form is not an encrypt mode form
 * @returns 400 when Joi validation fails
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have read permissions for form
 * @returns 404 when submissionId cannot be found in the database
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when any errors occurs in database query or generating signed URL
 */
AdminFormsSubmissionsRouter.route(
  '/:formId([a-fA-F0-9]{24})/submissions/:submissionId([a-fA-F0-9]{24})',
).get(EncryptSubmissionController.handleGetEncryptedResponse)

/**
 * Retrieve metadata of responses for a form with encrypted storage
 * @route GET /:formId/submissions/metadata
 * @security session
 *
 * @returns 200 with paginated submission metadata when no submissionId is provided
 * @returns 200 with single submission metadata of submissionId when provided
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsSubmissionsRouter.get(
  '/:formId([a-fA-F0-9]{24})/submissions/metadata',
  EncryptSubmissionController.handleGetMetadata,
)

/**
 * Retrieve all encrypted response form a form
 */
AdminFormsSubmissionsRouter.get(
  '/:formId([a-fA-F0-9]{24})/submissions',
  EncryptSubmissionController.handleGetAllEncryptedResponse,
)
