import { Router } from 'express'

import * as FeedbackController from '../../../../modules/feedback/feedback.controller'

export const PublicFormsFeedbackRouter = Router()

/**
 * Send feedback for a public form
 * @route POST /:formId/submissions/:submissionId/feedback
 * @group forms - endpoints to serve forms
 * @param {string} formId.path.required - the form id
 * @param {string} submissionId.path.required - the form submission id
 * @param {Feedback.model} feedback.body.required - the user's feedback
 * @consumes application/json
 * @produces application/json
 * @returns 200 if feedback was successfully saved
 * @returns 400 if form feedback was malformed and hence cannot be saved
 * @returns 404 if form with formId or submissionId does not exist, or form is private
 * @returns 410 if form has been archived
 * @returns 422 if form feedback for the submissionId has already been submitted
 * @returns 500 if database error occurs
 */
PublicFormsFeedbackRouter.route(
  '/:formId([a-fA-F0-9]{24})/submissions/:submissionId([a-fA-F0-9]{24})/feedback',
).post(FeedbackController.handleSubmitFormFeedback)
