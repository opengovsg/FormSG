import { Router } from 'express'

import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'

export const AdminFormsLogicRouter = Router()

/**
 * Deletes a logic.
 * @route DELETE /admin/forms/:formId/logic/:logicId
 * @group admin
 * @produces application/json
 * @consumes application/json
 * @returns 200 with success message when successfully deleted
 * @returns 403 when user does not have permissions to delete logic
 * @returns 404 when form cannot be found
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsLogicRouter.route(
  '/:formId([a-fA-F0-9]{24})/logic/:logicId([a-fA-F0-9]{24})',
).delete(AdminFormController.handleDeleteLogic)

/**
 * Updates a logic.
 * @route PUT /admin/forms/:formId/logic/:logicId
 * @group admin
 * @produces application/json
 * @consumes application/json
 * @returns 200 with success message when successfully updated
 * @returns 403 when user does not have permissions to update logic
 * @returns 404 when form cannot be found
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsLogicRouter.route(
  '/:formId([a-fA-F0-9]{24})/logic/:logicId([a-fA-F0-9]{24})',
).put(AdminFormController.handleUpdateLogic)
