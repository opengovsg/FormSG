import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import { AuthType, Status } from '../../../../../../types'
import { SettingsUpdateDto } from '../../../../../../types/api'
import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'

export const AdminFormsSettingsRouter = Router()

/**
 * Joi validator for PATCH /forms/:formId/settings route.
 */
const updateSettingsValidator = celebrate({
  [Segments.BODY]: Joi.object<SettingsUpdateDto>({
    authType: Joi.string().valid(...Object.values(AuthType)),
    emails: Joi.alternatives().try(
      Joi.array().items(Joi.string().email()),
      Joi.string().email({ multiple: true }),
    ),
    esrvcId: Joi.string().allow(''),
    hasCaptcha: Joi.boolean(),
    inactiveMessage: Joi.string(),
    status: Joi.string().valid(...Object.values(Status)),
    submissionLimit: Joi.number().allow(null),
    title: Joi.string(),
    webhook: Joi.object({
      url: Joi.string().uri().required().allow(''),
    }),
  }).min(1),
})

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
  .patch(updateSettingsValidator, AdminFormController.handleUpdateSettings)
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

/**
 * Updates the collaborator list for a given formId
 * @route GET /admin/forms/:formId/collaborators
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
AdminFormsSettingsRouter.route('/:formId([a-fA-F0-9]{24})/collaborators')
  .put(AdminFormController.handleUpdateCollaborators)
  .get(AdminFormController.handleGetFormCollaborators)
