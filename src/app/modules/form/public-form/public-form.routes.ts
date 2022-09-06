import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import * as PublicFormController from './public-form.controller'

/** @deprecated use PublicFormsFormRouter in src/app/routes/api/v3/forms/public-forms.form.routes.ts instead. */
export const PublicFormRouter = Router()

/**
 * Returns the specified form to the user, along with any
 * identify information obtained from Singpass/Corppass/MyInfo.
 *
 * WARNING: TemperatureSG batch jobs rely on this endpoint to
 * retrieve the master list of personnel for daily reporting.
 * Please strictly ensure backwards compatibility.
 * @deprecate in favour of GET /api/v3/forms/:formId
 * @route GET /:formId/publicform
 *
 * @returns 200 with form when form exists and is public
 * @returns 404 when form is private or form with given ID does not exist
 * @returns 410 when form is archived
 * @returns 500 when database error occurs
 */
PublicFormRouter.get(
  '/:formId([a-fA-F0-9]{24})/publicform',
  PublicFormController.handleGetPublicForm,
)

/**
 * Redirect a form to the main index, with the specified path
 * suffixed with a hashbang (`/#!`).
 * @route GET /{Id}
 * @route GET /{Id}/embed
 * @route GET /{Id}/preview
 * @route GET /{Id}/template
 * @route GET /{Id}/use-template
 * @route GET /forms/:agency/{Id}
 * @route GET /forms/:agency/{Id}/embed
 * @route GET /forms/:agency/{Id}/preview
 * @route GET /forms/:agency/{Id}/template
 * @route GET /forms/:agency/{Id}/use-template
 * @group forms - endpoints to serve forms
 * @returns 302 - redirects the user to the specified form,
 * through the main index, with the form ID specified as a hashbang path
 */
PublicFormRouter.get(
  '/:Id([a-fA-F0-9]{24})/:state(preview|template|use-template)?',
  PublicFormController.handleRedirect,
)

PublicFormRouter.get(
  '/:Id([a-fA-F0-9]{24})/embed',
  PublicFormController.handleRedirect,
)

PublicFormRouter.get(
  '/forms/:agency/:Id([a-fA-F0-9]{24})/:state(preview|template|use-template)?',
  PublicFormController.handleRedirect,
)

PublicFormRouter.get(
  '/forms/:agency/:Id([a-fA-F0-9]{24})/embed',
  PublicFormController.handleRedirect,
)

/**
 * Send feedback for a public form
 * @deprecate in favour of POST api/v3/forms/:formId/feedback
 * @route POST /:formId/feedback
 * @returns 200 if feedback was successfully saved
 * @returns 400 if form feedback was malformed and hence cannot be saved
 * @returns 404 if form with formId does not exist or is private
 * @returns 410 if form has been archived
 * @returns 500 if database error occurs
 */
PublicFormRouter.post(
  '/:formId([a-fA-F0-9]{24})/feedback',
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
