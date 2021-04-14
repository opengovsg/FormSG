import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import { IForm, ResponseMode } from '../../../../../../types'
import { withUserAuthentication } from '../../../../../modules/auth/auth.middlewares'
import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'
import { DuplicateFormBody } from '../../../../../modules/form/admin-form/admin-form.types'

export const AdminFormsFormRouter = Router()

// Validators
const createFormValidator = celebrate({
  [Segments.BODY]: {
    form: Joi.object<Omit<IForm, 'admin'>>()
      .keys({
        // Require valid responsesMode field.
        responseMode: Joi.string()
          .valid(...Object.values(ResponseMode))
          .required(),
        // Require title field.
        title: Joi.string().min(4).max(200).required(),
        // Require emails string (for backwards compatibility) or string
        // array if form to be created in Email mode.
        emails: Joi.alternatives()
          .try(Joi.array().items(Joi.string()).min(1), Joi.string())
          .when('responseMode', {
            is: ResponseMode.Email,
            then: Joi.required(),
          }),
        // Require publicKey field if form to be created in Storage mode.
        publicKey: Joi.string()
          .allow('')
          .when('responseMode', {
            is: ResponseMode.Encrypt,
            then: Joi.string().required().disallow(''),
          }),
      })
      .required()
      // Allow other form schema keys to be passed for form creation.
      .unknown(true),
  },
})

const duplicateFormValidator = celebrate({
  [Segments.BODY]: Joi.object<DuplicateFormBody>({
    // Require valid responsesMode field.
    responseMode: Joi.string()
      .valid(...Object.values(ResponseMode))
      .required(),
    // Require title field.
    title: Joi.string().min(4).max(200).required(),
    // Require emails string (for backwards compatibility) or string array
    // if form to be duplicated in Email mode.
    emails: Joi.alternatives()
      .try(Joi.array().items(Joi.string()).min(1), Joi.string())
      .when('responseMode', {
        is: ResponseMode.Email,
        then: Joi.required(),
      }),
    // Require publicKey field if form to be duplicated in Storage mode.
    publicKey: Joi.string()
      .allow('')
      .when('responseMode', {
        is: ResponseMode.Encrypt,
        then: Joi.string().required().disallow(''),
      }),
  }),
})

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
  .post(createFormValidator, AdminFormController.handleCreateForm)

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
  '/:formId([a-fA-F0-9]{24})/',
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
  duplicateFormValidator,
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
  withUserAuthentication,
  celebrate({
    [Segments.BODY]: {
      email: Joi.string()
        .required()
        .email({
          minDomainSegments: 2, // Number of segments required for the domain
          tlds: { allow: true }, // TLD (top level domain) validation
          multiple: false, // Disallow multiple emails
        })
        .message('Please enter a valid email'),
    },
  }),
  AdminFormController.handleTransferFormOwnership,
)
