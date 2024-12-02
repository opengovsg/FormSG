import { Router } from 'express'

import * as AdminFeedbackController from '../../../../../modules/admin-feedback/admin-feedback.controller'
import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'

export const AdminFormsFormRouter = Router()

AdminFormsFormRouter.route('/')
  /**
   * List the forms managed by the user
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

AdminFormsFormRouter.route('/:formId([a-fA-F0-9]{24})')
  /**
   * Return the specified form to the user.
   * @security session
   *
   * @returns 200 with retrieved form with formId if user has read permissions
   * @returns 401 when user does not exist in session
   * @returns 403 when user does not have permissions to access form
   * @returns 404 when form cannot be found
   * @returns 410 when form is archived
   * @returns 422 when user in session cannot be retrieved from the database
   * @returns 500 when database error occurs
   */
  .get(AdminFormController.handleGetAdminForm)
  /**
   * Archive the specified form.
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
  .delete(AdminFormController.handleArchiveForm)

/**
 * Duplicate the specified form.
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
 * Create a new form using the specified form as a template
 * @security session
 *
 * @returns 200 with the new form dashboard view
 * @returns 400 when Joi validation fails
 * @returns 401 when user does not exist in session
 * @returns 403 when form is private
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsFormRouter.post(
  '/:formId([a-fA-F0-9]{24})/use-template',
  AdminFormController.handleCopyTemplateForm,
)

/**
 * Transfer form ownership to another user
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
 * Transfer all forms belonging to one user to another user
 * @security session
 *
 * @returns 200 with true if forms were successfully transferred to new owner
 * @returns 400 when Joi validation fails
 * @returns 400 when new owner is not in the database yet
 * @returns 400 when new owner is already current owner
 * @returns 401 when user does not exist in session
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsFormRouter.post(
  '/all-transfer-owner',
  AdminFormController.handleTransferAllFormsOwnership,
)

/**
 * Specific form field REST APIs
 */
AdminFormsFormRouter.route(
  '/:formId([a-fA-F0-9]{24})/fields/:fieldId([a-fA-F0-9]{24})',
)
  /**
   * Update form field according to given new body.
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
   * @security session
   *
   * @returns 200 with form field when retrieval is successful
   * @returns 403 when current user does not have permissions to retrieve form field
   * @returns 404 when form cannot be found
   * @returns 404 when form field cannot be found
   * @returns 410 when retrieving form field of an archived form
   * @returns 422 when user in session cannot be retrieved from the database
   * @returns 500 when database error occurs
   */
  .get(AdminFormController.handleGetFormField)

AdminFormsFormRouter.put(
  '/:formId([a-fA-F0-9]{24})/fields/:fieldId([a-fA-F0-9]{24})/options-to-recipients-map',
  AdminFormController.handleUpdateOptionsToRecipientsMap,
)

/**
 * Duplicates the form field with the fieldId from the specified form
 * @security session
 *
 * @returns 200 with duplicated field
 * @returns 400 when form field has invalid updates to be performed
 * @returns 403 when current user does not have permissions to update form
 * @returns 404 when form or field to duplicate cannot be found
 * @returns 409 when saving updated form incurs a conflict in the database
 * @returns 410 when form to update is archived
 * @returns 413 when updated form is too large to be saved in the database
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsFormRouter.post(
  '/:formId([a-fA-F0-9]{24})/fields/:fieldId([a-fA-F0-9]{24})/duplicate',
  AdminFormController.handleDuplicateFormField,
)

AdminFormsFormRouter.post(
  '/:formId([a-fA-F0-9]{24})/fields/:fieldId([a-fA-F0-9]{24})/reorder',
  AdminFormController.handleReorderFormField,
)

AdminFormsFormRouter.post(
  '/:formId([a-fA-F0-9]{24})/fields',
  AdminFormController.handleCreateFormField,
)

AdminFormsFormRouter.route('/:formId([a-fA-F0-9]{24})/workflow').post(
  AdminFormController.handleCreateWorkflowStep,
)

AdminFormsFormRouter.route(
  '/:formId([a-fA-F0-9]{24})/workflow/:stepNumber(\\d+)',
)
  .put(AdminFormController.handleUpdateWorkflowStep)
  .delete(AdminFormController.handleDeleteWorkflowStep)

AdminFormsFormRouter.put(
  '/:formId([a-fA-F0-9]{24})/end-page',
  AdminFormController.handleUpdateEndPage,
)

/**
 * Replaces the startPage of the given form with what is given in the request
 * @precondition Must be preceded by request validation
 * @security session
 *
 * @returns 200 with updated start page
 * @returns 403 when current user does not have permissions to update the start page
 * @returns 404 when form cannot be found
 * @returns 410 when updating the start page for an archived form
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsFormRouter.put(
  '/:formId([a-fA-F0-9]{24})/start-page',
  AdminFormController.handleUpdateStartPage,
)

AdminFormsFormRouter.route('/feedback')
  /**
   * Submit an admin form creating feedback
   * and returns the feedback document on success
   * @precondition user should be logged in
   * @precondition Joi validation should enforce shape of req.body before this handler is invoked.
   * @security session
   *
   * @returns 200 if feedback was successfully saved
   * @returns 400 when Joi validation fails
   * @returns 401 when user does not exist in session
   * @returns 500 if database error occurs
   */
  .post(AdminFeedbackController.handleSubmitAdminFeedback)

AdminFormsFormRouter.route('/feedback/:feedbackId([a-fA-F0-9]{24})')
  /**
   * Update an existing admin feedback
   * @precondition Joi validation should enforce shape of req.body before this handler is invoked.
   * @security session
   *
   * @returns 200 if feedback was successfully updated
   * @returns 400 when Joi validation fails
   * @returns 401 when user does not exist in session
   * @returns 404 when admin feedback cannnot be found in the database
   * @returns 500 if database error occurs
   */
  .patch(AdminFeedbackController.handleUpdateAdminFeedback)
