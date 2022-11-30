import { Router } from 'express'

import * as PublicFormController from '../../../../modules/form/public-form/public-form.controller'

export const PublicFormsAuthRouter = Router()

/**
 * Redirects the user to the specified authentication provider.
 * After authenticating their identity, the user is redirected back to the form
 * @route /:formId/auth/redirect
 * @param isPersistentLogin if the user chooses to have their information saved to avoid future logins
 *
 * @returns 200 with the redirect url when the user authenticates successfully
 * @returns 400 when there is an error on the authType of the form
 * @returns 400 when the eServiceId of the form does not exist
 * @returns 404 when form with given ID does not exist
 * @returns 500 when database error occurs
 * @returns 500 when the redirect url could not be created
 * @returns 500 when the redirect feature is not enabled
 */
PublicFormsAuthRouter.route('/:formId([a-fA-F0-9]{24})/auth/redirect').get(
  PublicFormController.handleFormAuthRedirect,
)

/**
 * Removes SP/CP JWT cookie when called to logout user from SP/CP
 * @route /auth/:authType/logout
 *
 * @returns 200 with success message when user logs out successfully
 * @returns 400 if authType is invalid
 */
PublicFormsAuthRouter.route('/auth/:authType/logout').get(
  PublicFormController.handlePublicAuthLogout,
)
