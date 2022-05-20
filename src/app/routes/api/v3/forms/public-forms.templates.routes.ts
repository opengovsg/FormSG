import { Router } from 'express'

import * as PublicFormController from '../../../../modules/form/public-form/public-form.controller'

export const PublicFormTemplatesRouter = Router()

/**
 * Returns all the available form templates to the user.
 *
 * @route GET /templates
 *
 * @returns 200 with form templates when form templates exist
 * @returns 404 when form templates do not exist
 * @returns 500 when database error occurs
 */
PublicFormTemplatesRouter.route('/templates').get(
  PublicFormController.handleGetFormTemplates,
)
