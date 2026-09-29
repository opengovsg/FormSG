import { Router } from 'express'

import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'

export const AdminFormsSavedViewsRouter = Router()

/**
 * Creates a saved view.
 * @route POST /admin/forms/:formId/saved-views
 * @group admin
 * @produces application/json
 * @consumes application/json
 * @returns 200 with the form's saved views when successfully created
 * @returns 403 when user does not have permissions to edit the form
 * @returns 404 when form cannot be found
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsSavedViewsRouter.route('/:formId([a-fA-F0-9]{24})/saved-views').post(
  AdminFormController.handleCreateSavedView,
)
