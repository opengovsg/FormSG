import { Router } from 'express'

import { rateLimitConfig } from '../../../../../../config/config'
import { authenticateApiKeyPlatformUser } from '../../../../../../modules/auth/auth.middlewares'
import * as AdminFormController from '../../../../../../modules/form/admin-form/admin-form.controller'
import { limitRate } from '../../../../../../utils/limit-rate'

export const AdminFormsPlatformRouter = Router()

// All routes in this handler should be protected by authentication.
AdminFormsPlatformRouter.use(authenticateApiKeyPlatformUser)

AdminFormsPlatformRouter.route('/:formId([a-fA-F0-9]{24})/webhooksettings')
  /**
   * Retrieve the webhook and response mode settings of the specified form
   * @security bearer
   * @route GET /admin/forms/:formId/settings
   * @param body the user email
   *
   * @returns 200 with latest form settings
   * @returns 401 when current user is not logged in
   * @returns 403 when current user does not have permissions to obtain form settings
   * @returns 404 when form to retrieve settings for cannot be found
   * @returns 500 when database error occurs
   */
  .get(
    limitRate({ max: rateLimitConfig.publicApi }), //TODO: add platformApi rate limit config
    AdminFormController.handleGetWebhookSettings,
  )

  /**
   * Update form settings according to given subset of settings.
   * @route PATCH /admin/forms/:formId/webhooksettings
   * @group admin
   * @param body the subset of settings to patch and the user email
   * @produces application/json
   * @consumes application/json
   * @returns 200 with latest form settings on successful update
   * @returns 400 when given body fails Joi validation
   * @returns 401 when current user is not logged in
   * @returns 403 when current user does not have permissions to update form settings
   * @returns 404 when form to update settings for cannot be found
   * @returns 409 when saving form settings incurs a conflict in the database
   * @returns 410 when updating settings for archived form
   * @returns 413 when updating settings causes form to be too large to be saved in the database
   * @returns 422 when an invalid settings update is attempted on the form
   * @returns 422 when user cannot be retrieved from the database
   * @returns 500 when database error occurs
   */
  .patch(AdminFormController.handleUpdateWebhookSettings)
