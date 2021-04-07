import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import * as PublicFormController from '../../../../modules/form/public-form/public-form.controller'

export const PublicFormsRouter = Router()

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
PublicFormsRouter.route('/:formId([a-fA-F0-9]{24})/feedback').post(
  celebrate({
    [Segments.BODY]: Joi.object()
      .keys({
        rating: Joi.number().min(1).max(5).cast('string').required(),
        comment: Joi.string().allow('').required(),
      })
      // Allow other keys for backwards compability as frontend might put
      // extra keys in the body.
      .unknown(true),
  }),
  PublicFormController.handleSubmitFeedback,
)
