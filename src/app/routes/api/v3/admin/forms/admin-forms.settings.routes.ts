import { Router } from 'express'

import { rateLimitConfig } from '../../../../../config/config'
import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'
import { limitRate } from '../../../../../utils/limit-rate'

export const AdminFormsSettingsRouter = Router()

AdminFormsSettingsRouter.route('/:formId([a-fA-F0-9]{24})/settings')
  /**
   * Update form settings according to given subset of settings.
   * @route PATCH /admin/forms/:formId/settings
   * @group admin
   * @param body the subset of settings to patch
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
   * @returns 422 when user in session cannot be retrieved from the database
   * @returns 500 when database error occurs
   */
  .patch(AdminFormController.handleUpdateSettings)
  /**
   * Retrieve the settings of the specified form
   * @route GET /admin/forms/:formId/settings
   * @group admin
   * @produces application/json
   * @returns 200 with latest form settings on successful update
   * @returns 401 when current user is not logged in
   * @returns 403 when current user does not have permissions to obtain form settings
   * @returns 404 when form to retrieve settings for cannot be found
   * @returns 409 when saving form settings incurs a conflict in the database
   * @returns 500 when database error occurs
   */
  .get(AdminFormController.handleGetSettings)

AdminFormsSettingsRouter.route('/:formId([a-fA-F0-9]{24})/settings/whitelist')
  .get(
    limitRate({ max: rateLimitConfig.downloadFormWhitelist }),
    AdminFormController.handleGetWhitelistSetting,
  )
  .put(
    limitRate({ max: rateLimitConfig.uploadFormWhitelist }),
    AdminFormController.handleUpdateWhitelistSetting,
  )

AdminFormsSettingsRouter.route('/:formId([a-fA-F0-9]{24})/collaborators')
  /**
   * Updates the collaborator list for a given formId
   * @route PUT /admin/forms/:formId/collaborators
   * @group admin
   * @precondition Must be preceded by request validation
   * @security session
   *
   * @returns 200 with updated collaborators and permissions
   * @returns 403 when current user does not have permissions to update the collaborators
   * @returns 404 when form cannot be found
   * @returns 410 when updating collaborators for an archived form
   * @returns 422 when user in session cannot be retrieved from the database
   * @returns 500 when database error occurs
   */
  .put(AdminFormController.handleUpdateCollaborators)
  /**
   * Retrieves the collaborators for a given formId
   * @route GET /admin/forms/:formId/collaborators
   * @group admin
   * @precondition Must be preceded by request validation
   * @security session

   *
   * @returns 200 with collaborators
   * @returns 403 when current user does not have read permissions for the form
   * @returns 404 when form cannot be found
   * @returns 410 when retrieving collaborators for an archived form
   * @returns 422 when user in session cannot be retrieved from the database
   * @returns 500 when database error occurs
   */
  .get(AdminFormController.handleGetFormCollaborators)

AdminFormsSettingsRouter.route('/:formId([a-fA-F0-9]{24})/collaborators/self')
  /**
   * Removes the current user from the collaborator list
   * @route DELETE /admin/forms/:formId/collaborators/self
   * @group admin
   * @precondition Must be preceded by request validation
   * @security session
   *
   * @returns 200 with updated collaborators and permissions
   * @returns 403 when current user does not have permissions to remove themselves the collaborators list
   * @returns 404 when form cannot be found
   * @returns 410 when updating collaborators for an archived form
   * @returns 422 when user in session cannot be retrieved from the database
   * @returns 500 when database error occurs
   */
  .delete(AdminFormController.handleRemoveSelfFromCollaborators)
