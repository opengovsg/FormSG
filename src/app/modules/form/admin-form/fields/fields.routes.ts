/**
 * Old routes that has not been migrated to their new /api/v3/ root endpoints.
 */

import { Router } from 'express'

import { withUserAuthentication } from '../../../auth/auth.middlewares'

import * as FieldsController from './fields.controller'

export const FieldsRouter = Router()

/**
 * Duplicates field in admin form
 * @route POST /api/v3/admin/forms/:formId/fields/:fieldId/duplicate
 * @security session
 *
 * @returns 200 with updated form
 * @returns 400 when form field has invalid updates to be performed
 * @returns 403 when current user does not have permissions to update form
 * @returns 404 when form/field to update cannot be found
 * @returns 409 when saving updated form incurs a conflict in the database
 * @returns 410 when form to update is archived
 * @returns 413 when updated form is too large to be saved in the database
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
FieldsRouter.post(
  '/api/v3/admin/forms/:formId/fields/:fieldId/duplicate',
  withUserAuthentication,
  FieldsController.handleDuplicateField,
)
