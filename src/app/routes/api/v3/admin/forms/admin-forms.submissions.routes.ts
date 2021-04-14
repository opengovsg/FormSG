import { Router } from 'express'

import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'
import * as EncryptSubmissionController from '../../../../../modules/submission/encrypt-submission/encrypt-submission.controller'

export const AdminFormsSubmissionsRouter = Router()

/**
 * Count the number of submissions for a public form
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
