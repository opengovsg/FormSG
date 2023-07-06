import { Router } from 'express'

import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.issue.controller'

export const AdminFormsIssueRouter = Router()

/**
 * Retrieve issues for a public form
 * @route GET /api/v3/admin/forms/:formId/issue
 * @security session
 *
 * @returns 200 with issue response
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsIssueRouter.get(
  '/:formId([a-fA-F0-9]{24})/issue',
  AdminFormController.handleGetFormIssue,
)

/**
 * Stream download all issues for a form
 * @route GET /api/v3/admin/forms/:formId/issue/download
 * @security session
 *
 * @returns 200 with issue response
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsIssueRouter.get(
  '/:formId([a-fA-F0-9]{24})/issue/download',
  AdminFormController.handleStreamFormIssue,
)
