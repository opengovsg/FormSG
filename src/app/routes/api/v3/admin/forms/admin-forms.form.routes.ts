import { Router } from 'express'

import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'

export const AdminFormsFormRouter = Router()

AdminFormsFormRouter.route('/')
  /**
   * List the forms managed by the user
   * @route GET /adminform
   * @security session
   *
   * @returns 200 with a list of forms managed by the user
   * @returns 401 when user is not logged in
   * @returns 422 when user of given id cannnot be found in the database
   * @returns 500 when database errors occur
   */
  .get(AdminFormController.handleListDashboardForms)

  /**
   * Create a new form
   * @route POST /adminform
   * @security session
   *
   * @returns 200 with newly created form
   * @returns 400 when Joi validation fails
   * @returns 401 when user does not exist in session
   * @returns 409 when a database conflict error occurs
   * @returns 413 when payload for created form exceeds size limit
   * @returns 422 when user of given id cannnot be found in the database
   * @returns 422 when form parameters are invalid
   * @returns 500 when database error occurs
   */
  .post(AdminFormController.handleCreateForm)

/**
 * Archive the specified form.
 * @route DELETE /:formId/adminform
 * @security session
 *
 * @returns 200 with success message when successfully archived
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have permissions to archive form
 * @returns 404 when form cannot be found
 * @returns 410 when form is already archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsFormRouter.delete(
  '/:formId([a-fA-F0-9]{24})',
  AdminFormController.handleArchiveForm,
)

/**
 * Duplicate the specified form.
 * @route POST /:formId/adminform
 * @security session
 *
 * @returns 200 with the duplicate form dashboard view
 * @returns 400 when Joi validation fails
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsFormRouter.post(
  '/:formId([a-fA-F0-9]{24})/duplicate',
  AdminFormController.handleDuplicateAdminForm,
)

/**
 * Transfer form ownership to another user
 * @route POST /:formId/adminform/transfer-owner
 * @security session
 *
 * @returns 200 with updated form with transferred owners
 * @returns 400 when Joi validation fails
 * @returns 400 when new owner is not in the database yet
 * @returns 400 when new owner is already current owner
 * @returns 401 when user does not exist in session
 * @returns 403 when user is not the current owner of the form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsFormRouter.post(
  '/:formId([a-fA-F0-9]{24})/collaborators/transfer-owner',
  AdminFormController.handleTransferFormOwnership,
)

/**
 * Specific form field REST APIs
 */
AdminFormsFormRouter.route(
  '/:formId([a-fA-F0-9]{24})/fields/:fieldId([a-fA-F0-9]{24})',
)
  /**
   * Update form field according to given new body.
   * @route PUT /admin/forms/:formId/fields/:fieldId
   *
   * @param body the new field to override current field
   * @returns 200 with updated form field
   * @returns 400 when given body fails Joi validation
   * @returns 401 when current user is not logged in
   * @returns 403 when current user does not have permissions to update form field
   * @returns 404 when form cannot be found
   * @returns 404 when field cannot be found
   * @returns 410 when updating form field for archived form
   * @returns 422 when an invalid form field update is attempted on the form
   * @returns 422 when user in session cannot be retrieved from the database
   * @returns 500 when database error occurs
   */
  .put(AdminFormController.handleUpdateFormField)
  /**
   * Delete form field by fieldId of form corresponding to formId.
   * @route DELETE /admin/forms/:formId/fields/:fieldId
   * @security session
   *
   * @returns 204 when deletion is successful
   * @returns 403 when current user does not have permissions to delete form field
   * @returns 404 when form cannot be found
   * @returns 404 when form field to delete cannot be found
   * @returns 410 when deleting form field of an archived form
   * @returns 422 when user in session cannot be retrieved from the database
   * @returns 500 when database error occurs during deletion
   */
  .delete(AdminFormController.handleDeleteFormField)
  /**
   * Retrives the form field using the fieldId from the specified form
   * @route GET /admin/forms/:formId/fields/:fieldId
   * @security session
   *
   * @returns 200 with form field
   * @returns 403 when current user does not have permissions to retrieve form field
   * @returns 404 when form cannot be found
   * @returns 404 when form field cannot be found
   * @returns 410 when retrieving form field of an archived form
   * @returns 422 when user in session cannot be retrieved from the database
   * @returns 500 when database error occurs
   */
  .get(AdminFormController.handleGetFormField)

AdminFormsFormRouter.post(
  '/:formId([a-fA-F0-9]{24})/fields/:fieldId([a-fA-F0-9]{24})/reorder',
  AdminFormController.handleReorderFormField,
)

AdminFormsFormRouter.post(
  '/:formId([a-fA-F0-9]{24})/fields',
  AdminFormController.handleCreateFormField,
)

AdminFormsFormRouter.put(
  '/:formId([a-fA-F0-9]{24})/end-page',
  AdminFormController.handleUpdateEndPage,
)
