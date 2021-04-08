import { celebrate, Joi, Segments } from 'celebrate'
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

/**
 * Redirect a form to the main index, with the specified path
 * suffixed with a hashbang (`/#!`)
 * parameter Id is used instead of formId as formById middleware is not needed
 * @route GET /{Id}
 * @route GET /{Id}/preview
 * @route GET /{Id}/embed
 * @route GET /{Id}/template
 * @route GET /{Id}/use-template
 * @group forms - endpoints to serve forms
 * @param {string} Id.path.required - the form id
 * @produces text/html
 * @returns {string} 302 - redirects the user to the specified form,
 * through the main index, with the form id specified as a hashbang path
 */
PublicFormRouter.get(
  '/:Id([a-fA-F0-9]{24})/:state(preview|template|use-template)?',
  PublicFormController.handleRedirect,
)

// TODO: Remove this embed endpoint
PublicFormRouter.get(
  '/:Id([a-fA-F0-9]{24})/embed',
  PublicFormController.handleRedirect,
)

/**
 * Redirect a form to the main index, with the specified path
 * suffixed with a hashbang (`/#!`). /forms/:agency is added for backward compatibility.
 * parameter Id is used instead of formId as formById middleware is not needed
 * TODO: Remove once all form links being shared do not have /forms/:agency
 * @route GET /forms/:agency/{Id}
 * @route GET /forms/:agency/{Id}/preview
 * @route GET /forms/:agency/{Id}/embed
 * @route GET /forms/:agency/{Id}/template
 * @route GET /{Id}/use-template
 * @group forms - endpoints to serve forms
 * @param {string} Id.path.required - the form id
 * @produces text/html
 * @returns {string} 302 - redirects the user to the specified form,
 * through the main index, with the form id specified as a hashbang path
 */
PublicFormRouter.get(
  '/forms/:agency/:Id([a-fA-F0-9]{24})/:state(preview|template|use-template)?',
  PublicFormController.handleRedirect,
)

PublicFormRouter.get(
  '/forms/:agency/:Id([a-fA-F0-9]{24})/embed',
  PublicFormController.handleRedirect,
)

/**
 * @typedef Feedback
 * @property {number} rating.required - the user's rating of the form
 * @property {string} comment - any comments the user might have
 */

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

/**
 * @typedef PublicForm
 * @property {object} form.required - the form
 * @property {object} spcpSession - contains identity information from SingPass/CorpPass
 * @property {boolean} myInfoError - indicates if there was any errors while accessing MyInfo
 */

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
