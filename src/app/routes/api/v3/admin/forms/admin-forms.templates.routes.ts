import { Router } from 'express'

import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'

export const AdminFormTemplatesRouter = Router()

/**
 * Returns all the available form templates to the user.
 *
 * @route GET /templates
 *
 * @returns 200 with a list of all form templates
 * @returns 401 when user is not logged in
 * @returns 500 when database error occurs
 */
AdminFormTemplatesRouter.route('/templates').get(
  AdminFormController.handleGetFormTemplates,
)
