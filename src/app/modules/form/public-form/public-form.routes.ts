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
  '/:formId([a-fA-F0-9]{24})/:state(preview|template|use-template)',
  PublicFormController.handleRedirect,
)

PublicFormRouter.get(
  '/:formId([a-fA-F0-9]{24})/embed',
  PublicFormController.handleRedirect,
)

PublicFormRouter.get(
  '/forms/:agency/:formId([a-fA-F0-9]{24})/:state(preview|template|use-template)?',
  PublicFormController.handleRedirect,
)

PublicFormRouter.get(
  '/forms/:agency/:formId([a-fA-F0-9]{24})/embed',
  PublicFormController.handleRedirect,
)
