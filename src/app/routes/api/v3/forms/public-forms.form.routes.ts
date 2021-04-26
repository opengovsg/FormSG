import { Router } from 'express'

import * as PublicFormController from '../../../../modules/form/public-form/public-form.controller'

export const PublicFormsFormRouter = Router()

/**
 * Returns the specified form to the user, along with any
 * identify information obtained from Singpass/Corppass/MyInfo.
 *
 * WARNING: TemperatureSG batch jobs rely on this endpoint to
 * retrieve the master list of personnel for daily reporting.
 * Please strictly ensure backwards compatibility.
 * @route GET /:formId
 *
 * @returns 200 with form when form exists and is public
 * @returns 404 when form is private or form with given ID does not exist
 * @returns 410 when form is archived
 * @returns 500 when database error occurs
 */
PublicFormsFormRouter.route('/:formId([a-fA-F0-9]{24})').get(
  PublicFormController.handleGetPublicForm,
)
