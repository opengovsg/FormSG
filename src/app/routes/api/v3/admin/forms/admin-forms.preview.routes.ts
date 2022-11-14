import { Router } from 'express'

import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'

export const AdminFormsPreviewRouter = Router()

/**
 * Return the preview form to the user.
 * Allows for both public and private forms, only for users with at least read permission.
 * @route GET api/v3/admin/forms/:formId/preview
 * @security session
 *
 * @returns 200 with target form's public view
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsPreviewRouter.get(
  '/:formId([a-fA-F0-9]{24})/preview',
  AdminFormController.handlePreviewAdminForm,
)

/**
 * Submit an email mode form in preview mode
 * @route POST api/v3/admin/forms/:formId([a-fA-F0-9]{24})/preview/submissions/email
 * @security session
 *
 * @returns 200 if submission was valid
 * @returns 400 when error occurs while processing submission or submission is invalid
 * @returns 403 when user does not have read permissions for form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsPreviewRouter.post(
  '/:formId([a-fA-F0-9]{24})/preview/submissions/email',
  AdminFormController.handleEmailPreviewSubmission,
)

/**
 * Submit an encrypt mode form in preview mode
 * @route POST api/v3/admin/forms/:formId([a-fA-F0-9]{24})/preview/submissions/encrypt
 * @security session
 *
 * @returns 200 if submission was valid
 * @returns 400 when error occurs while processing submission or submission is invalid
 * @returns 403 when user does not have read permissions for form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsPreviewRouter.post(
  '/:formId([a-fA-F0-9]{24})/preview/submissions/encrypt',
  AdminFormController.handleEncryptPreviewSubmission,
)

/**
 * Return the template preview of a form to the user.
 * Allows for public forms, only for users who are signed in.
 * @route GET api/v3/admin/forms/:formId/use-template
 * @security session
 *
 * @returns 200 with target form's template view
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsPreviewRouter.get(
  '/:formId([a-fA-F0-9]{24})/use-template',
  AdminFormController.handleGetTemplateForm,
)
