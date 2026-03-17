import { Router } from 'express'

import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'

export const AdminFormsPresignRouter = Router()

// Validators

/**
 * Upload images
 * @route POST /api/v3/admin/forms/:formId/images/presign
 * @security session
 *
 * @returns 200 with presigned POST URL object
 * @returns 400 when error occurs whilst creating presigned POST URL object
 * @returns 400 when Joi validation fails
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have write permissions for form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 */
AdminFormsPresignRouter.post(
  '/:formId([a-fA-F0-9]{24})/images/presign',
  AdminFormController.handleCreatePresignedPostUrlForImages,
)

/**
 * Upload logos
 * @route POST /api/v3/admin/forms/:formId/logos/presign
 * @security session
 *
 * @returns 200 with presigned POST URL object
 * @returns 400 when error occurs whilst creating presigned POST URL object
 * @returns 400 when Joi validation fails
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have write permissions for form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 */
AdminFormsPresignRouter.post(
  '/:formId([a-fA-F0-9]{24})/logos/presign',
  AdminFormController.handleCreatePresignedPostUrlForLogos,
)
