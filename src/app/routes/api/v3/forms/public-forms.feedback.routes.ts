import { Router } from 'express'

import * as PublicFormController from '../../../../modules/form/public-form/public-form.controller'

export const PublicFormsFeedbackRouter = Router()

/**
 * Send feedback for a public form
 * @route POST /:formId/feedback
 * @group forms - endpoints to serve forms
 * @param {string} formId.path.required - the form id
 * @param {Feedback.model} feedback.body.required - the user's feedback
 * @consumes application/json
 * @produces application/json
 * @returns 200 if feedback was successfully saved
 * @returns 400 if form feedback was malformed and hence cannot be saved
 * @returns 404 if form with formId does not exist or is private
 * @returns 410 if form has been archived
 * @returns 500 if database error occurs
 */
PublicFormsFeedbackRouter.route('/:formId([a-fA-F0-9]{24})/feedback').post(
  PublicFormController.handleSubmitFeedback,
)
