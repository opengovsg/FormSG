import { Router } from 'express'

import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'

export const AdminFormsFeedbackRouter = Router()

/**
 * Retrieve feedback for a public form
 * @route GET /api/v3/admin/forms/:formId/feedback
 * @security session
 *
 * @returns 200 with feedback response
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsFeedbackRouter.get(
  '/:formId([a-fA-F0-9]{24})/feedback',
  AdminFormController.handleGetFormFeedback,
)

/**
 * Count the number of feedback for a form
 * @route GET /api/v3/admin/forms/{formId}/feedback/count
 * @security session
 *
 * @returns 200 with feedback counts of given form
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsFeedbackRouter.get(
  '/:formId([a-fA-F0-9]{24})/feedback/count',
  AdminFormController.handleCountFormFeedback,
)

/**
 * Stream download all feedback for a form
 * @route GET /api/v3/admin/forms/{formId}/feedback/download
 * @security session
 *
 * @returns 200 with feedback stream
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database or stream error occurs
 */
AdminFormsFeedbackRouter.get(
  '/:formId([a-fA-F0-9]{24})/feedback/download',
  AdminFormController.handleStreamFormFeedback,
)
