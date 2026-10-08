import { Router } from 'express'

import { rateLimitConfig } from '../../../../../config/config'
import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'
import * as MultirespondentSubmissionController from '../../../../../modules/submission/multirespondent-submission/multirespondent-submission.controller'
import * as WorkflowReassignController from '../../../../../modules/submission/multirespondent-submission/workflow-reassign.controller'
import * as WorkflowStopController from '../../../../../modules/submission/multirespondent-submission/workflow-stop.controller'
import * as SubmissionController from '../../../../../modules/submission/submission.controller'
import * as WorkflowEventController from '../../../../../modules/workflow-event/workflow-event.controller'
import { limitRate } from '../../../../../utils/limit-rate'

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
).get(SubmissionController.handleStreamEncryptedResponses)

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
).get(SubmissionController.handleGetEncryptedResponse)

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
  SubmissionController.handleGetMetadata,
)

/**
 * Send reminder to the current pending step for the MRF submission with the given responseId
 */
AdminFormsSubmissionsRouter.post(
  '/:formId([a-fA-F0-9]{24})/submissions/:submissionId([a-fA-F0-9]{24})/remind',
  limitRate({ max: rateLimitConfig.mrfPendingSubmissionEmailReminder }),
  MultirespondentSubmissionController.handlePendingMrfSubmissionRemind,
)

/**
 * Stop a pending multirespondent workflow
 * @route POST /admin/forms/:formId/submissions/:submissionId/stop
 * @security session
 *
 * @returns 200 with the time the workflow was stopped
 * @returns 400 when the body is invalid
 * @returns 403 when the user cannot edit the form, or workflow actions are unavailable
 * @returns 404 when the submission cannot be found
 * @returns 409 when the workflow is no longer pending
 */
AdminFormsSubmissionsRouter.post(
  '/:formId([a-fA-F0-9]{24})/submissions/:submissionId([a-fA-F0-9]{24})/stop',
  limitRate({ max: rateLimitConfig.mrfPendingSubmissionEmailReminder }),
  WorkflowStopController.handleStopPendingMrfSubmission,
)

/**
 * Add people to the pending step of a multirespondent workflow
 * @route POST /admin/forms/:formId/submissions/:submissionId/assignees
 * @security session
 *
 * @returns 200 with the step number and the people added
 * @returns 400 when the body is invalid, or someone is already on the step
 * @returns 403 when the user cannot edit the form, or workflow actions are unavailable
 * @returns 404 when the submission cannot be found
 * @returns 409 when the workflow is no longer pending
 */
AdminFormsSubmissionsRouter.post(
  '/:formId([a-fA-F0-9]{24})/submissions/:submissionId([a-fA-F0-9]{24})/assignees',
  limitRate({ max: rateLimitConfig.mrfPendingSubmissionEmailReminder }),
  WorkflowReassignController.handleAddAssigneesToPendingMrfSubmission,
)

/**
 * Workflow actions recorded against a multirespondent submission
 * @route GET /admin/forms/:formId/submissions/:submissionId/workflow-events
 * @security session
 *
 * @returns 200 with the events, oldest first
 * @returns 403 when the user cannot view the form
 * @returns 404 when the form cannot be found
 */
AdminFormsSubmissionsRouter.get(
  '/:formId([a-fA-F0-9]{24})/submissions/:submissionId([a-fA-F0-9]{24})/workflow-events',
  WorkflowEventController.handleGetWorkflowEvents,
)
