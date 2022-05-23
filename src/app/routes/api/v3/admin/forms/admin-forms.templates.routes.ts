import { Router } from 'express'

import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'

export const AdminFormTemplatesRouter = Router()

/**
 * Returns all the available form templates to the user.
 *
 * @route GET /templates
 *
 * @returns 200 with form templates when form templates exist
 * @returns 404 when form templates do not exist
 * @returns 500 when database error occurs
 */
AdminFormTemplatesRouter.route('/templates').get(
  AdminFormController.handleGetFormTemplates,
)
