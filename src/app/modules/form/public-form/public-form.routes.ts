import { Router } from 'express'

import * as PublicFormController from './public-form.controller'

export const PublicFormRouter = Router()

/**
 * Returns the specified form to the user, along with any
 * identity information obtained from SingPass/CorpPass,
 * and MyInfo details, if any.
 *
 * WARNING: TemperatureSG batch jobs rely on this endpoint to
 * retrieve the master list of personnel for daily reporting.
 * Please strictly ensure backwards compatibility.
 *
 * @route GET /{formId}/publicform
 * @group forms - endpoints to serve forms
 * @param {string} formId.path.required - the form id
 * @consumes application/json
 * @produces application/json
 * @returns {string} 404 - form is not made public
 * @returns {PublicForm.model} 200 - the form, and other information
 */
PublicFormRouter.get(
  '/:formId([a-fA-F0-9]{24})/publicform',
  PublicFormController.handleGetPublicForm,
)
