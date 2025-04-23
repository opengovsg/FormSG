import { Router } from 'express'

import * as RespondentCopyController from '../../../../modules/respondent-copy/respondent-copy.controller'

export const PublicFormsRespondentCopyRouter = Router()

/**
 * Send respondent copies for a public form
 * @route POST /:formId/:submissionId/respondentCopy
 * @group forms - endpoints to serve forms
 * @param {string} formId.path.required - the form id
 * @param {string} submissionId.path.required - the form submission id
 * @param {RespondentCopy.model} respondentCopy.body.required - the user's feedback
 * @consumes application/json
 * @produces application/json
 * @returns 200 if respondent copy emails was successfully sent
 * @returns 400 if respondent copy emails was malformed and hence cannot be saved
 * @returns 404 if form with formId or submissionId does not exist, or form is private
 * @returns 410 if form has been archived
 * @returns 422 if respondent copy emails for the submissionId has already been submitted
 * @returns 500 if database error occurs
 */
PublicFormsRespondentCopyRouter.route(
  '/:formId([a-fA-F0-9]{24})/submissions/:submissionId([a-fA-F0-9]{24})/respondentCopy',
).post(RespondentCopyController.handleSubmitFormRespondentCopy)
