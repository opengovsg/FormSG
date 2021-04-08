/**
 * Old routes that has not been migrated to their new /api/v3/ root endpoints.
 */

import JoiDate from '@joi/date'
import { celebrate, Joi as BaseJoi, Segments } from 'celebrate'
import { Router } from 'express'

import { VALID_UPLOAD_FILE_TYPES } from '../../../../shared/constants'
import { IForm, ResponseMode } from '../../../../types'
import { withUserAuthentication } from '../../auth/auth.middlewares'
import * as EncryptSubmissionController from '../../submission/encrypt-submission/encrypt-submission.controller'
import * as EncryptSubmissionMiddleware from '../../submission/encrypt-submission/encrypt-submission.middleware'

import * as AdminFormController from './admin-form.controller'
import { DuplicateFormBody } from './admin-form.types'

export const AdminFormsRouter = Router()

const Joi = BaseJoi.extend(JoiDate) as typeof BaseJoi

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

const fileUploadValidator = celebrate({
  [Segments.BODY]: {
    fileId: Joi.string().required(),
    fileMd5Hash: Joi.string().base64().required(),
    fileType: Joi.string()
      .valid(...VALID_UPLOAD_FILE_TYPES)
      .required(),
  },
})

AdminFormsRouter.route('/adminform')
  // All HTTP methods of route protected with authentication.
  .all(withUserAuthentication)
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

AdminFormsRouter.route('/:formId([a-fA-F0-9]{24})/adminform')
  // All HTTP methods of route protected with authentication.
  .all(withUserAuthentication)
  /**
   * Return the specified form to the user.
   * @route GET /:formId/adminform
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
   * Update the specified form.
   * @route PUT /:formId/adminform
   * @security session
   *
   * @returns 200 with updated form
   * @returns 400 when form field has invalid updates to be performed
   * @returns 401 when user does not exist in session
   * @returns 403 when current user does not have permissions to update form
   * @returns 404 when form to update cannot be found
   * @returns 409 when saving updated form incurs a conflict in the database
   * @returns 410 when form to update is archived
   * @returns 413 when updated form is too large to be saved in the database
   * @returns 422 when an invalid update is attempted on the form
   * @returns 422 when user in session cannot be retrieved from the database
   * @returns 500 when database error occurs
   */
  .put(AdminFormController.handleUpdateForm)
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
  .delete(AdminFormController.handleArchiveForm)
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
  .post(duplicateFormValidator, AdminFormController.handleDuplicateAdminForm)

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
AdminFormsRouter.post(
  '/:formId([a-fA-F0-9]{24})/adminform/transfer-owner',
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

/**
 * Return the template form to the user.
 * Only allows for public forms, for any logged in user.
 * @route GET /:formId/adminform/template
 * @security session
 *
 * @returns 200 with target form's public view
 * @returns 401 when user does not exist in session
 * @returns 403 when the target form is private
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 500 when database error occurs
 */
AdminFormsRouter.get(
  '/:formId([a-fA-F0-9]{24})/adminform/template',
  withUserAuthentication,
  AdminFormController.handleGetTemplateForm,
)

/**
 * Duplicate a specified form and return that form to the user.
 * @route GET /:formId/adminform/copy
 * @security session
 *
 * @returns 200 with the duplicate form dashboard view
 * @returns 400 when Joi validation fails
 * @returns 401 when user does not exist in session
 * @returns 403 when form is private
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsRouter.post(
  '/:formId([a-fA-F0-9]{24})/adminform/copy',
  withUserAuthentication,
  duplicateFormValidator,
  AdminFormController.handleCopyTemplateForm,
)

/**
 * Return the preview form to the user.
 * Allows for both public and private forms, only for users with at least read permission.
 * @route GET /:formId/adminform/preview
 * @security session
 *
 * @returns 200 with target form's public view
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsRouter.get(
  '/:formId([a-fA-F0-9]{24})/adminform/preview',
  withUserAuthentication,
  AdminFormController.handlePreviewAdminForm,
)

/**
 * Retrieve feedback for a public form
 * @route GET /:formId/adminform/feedback
 * @security session
 *
 * @returns 200 with feedback response
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsRouter.get(
  '/:formId([a-fA-F0-9]{24})/adminform/feedback',
  withUserAuthentication,
  AdminFormController.handleGetFormFeedbacks,
)

/**
 * Count the number of feedback for a form
 * @route GET /{formId}/adminform/feedback/count
 * @security session
 *
 * @returns 200 with feedback counts of given form
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsRouter.get(
  '/:formId([a-fA-F0-9]{24})/adminform/feedback/count',
  withUserAuthentication,
  AdminFormController.handleCountFormFeedback,
)

/**
 * Stream download all feedback for a form
 * @route GET /{formId}/adminform/feedback/download
 * @security session
 *
 * @returns 200 with feedback stream
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database or stream error occurs
 */
AdminFormsRouter.get(
  '/:formId([a-fA-F0-9]{24})/adminform/feedback/download',
  withUserAuthentication,
  AdminFormController.handleStreamFormFeedback,
)

/**
 * Retrieve actual response for a storage mode form
 * @route GET /:formId/adminform/submissions
 * @security session
 *
 * @returns 200 with encrypted submission data response
 * @returns 400 when form is not an encrypt mode form
 * @returns 400 when Joi validation fails
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have read permissions for form
 * @returns 404 when submissionId cannot be found in the database
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when any errors occurs in database query or generating signed URL
 */
AdminFormsRouter.get(
  '/:formId([a-fA-F0-9]{24})/adminform/submissions',
  withUserAuthentication,
  celebrate({
    [Segments.QUERY]: {
      submissionId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    },
  }),
  EncryptSubmissionController.handleGetEncryptedResponse,
)

/**
 * Count the number of submissions for a public form
 * @route GET /:formId/adminform/submissions/count
 * @security session
 *
 * @returns 200 with submission counts of given form
 * @returns 400 when query.startDate or query.endDate is malformed
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsRouter.get(
  '/:formId([a-fA-F0-9]{24})/adminform/submissions/count',
  withUserAuthentication,
  celebrate({
    [Segments.QUERY]: Joi.object()
      .keys({
        startDate: Joi.date().format('YYYY-MM-DD').raw(),
        endDate: Joi.date()
          .format('YYYY-MM-DD')
          .greater(Joi.ref('startDate'))
          .raw(),
      })
      .and('startDate', 'endDate'),
  }),
  AdminFormController.handleCountFormSubmissions,
)

/**
 * Retrieve metadata of responses for a form with encrypted storage
 * @route GET /:formId/adminform/submissions/metadata
 * @security session
 *
 * @returns 200 with paginated submission metadata when no submissionId is provided
 * @returns 200 with single submission metadata of submissionId when provided
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have permissions to access form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsRouter.get(
  '/:formId([a-fA-F0-9]{24})/adminform/submissions/metadata',
  withUserAuthentication,
  celebrate({
    [Segments.QUERY]: {
      submissionId: Joi.string().optional(),
      page: Joi.number().min(1).when('submissionId', {
        not: Joi.exist(),
        then: Joi.required(),
      }),
    },
  }),
  EncryptSubmissionController.handleGetMetadata,
)

/**
 * Stream download all encrypted responses for a form
 * @route GET /:formId/adminform/submissions/download
 * @security session
 *
 * @returns 200 with stream of encrypted responses
 * @returns 400 if form is not an encrypt mode form
 * @returns 400 when Joi validation fails
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have read permissions for form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 if any errors occurs in stream pipeline or error retrieving form
 */
AdminFormsRouter.get(
  '/:formId([a-fA-F0-9]{24})/adminform/submissions/download',
  withUserAuthentication,
  celebrate({
    [Segments.QUERY]: Joi.object()
      .keys({
        startDate: Joi.date().format('YYYY-MM-DD').raw(),
        endDate: Joi.date()
          .format('YYYY-MM-DD')
          .greater(Joi.ref('startDate'))
          .raw(),
        downloadAttachments: Joi.boolean().default(false),
      })
      .and('startDate', 'endDate'),
  }),
  EncryptSubmissionController.handleStreamEncryptedResponses,
)

/**
 * Upload images
 * @route POST /:formId/adminform/images
 * @security session
 *
 * @returns 200 with presigned POST URL object
 * @returns 400 when error occurs whilst creating presigned POST URL object
 * @returns 400 when Joi validation fails
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have write permissions for form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 */
AdminFormsRouter.post(
  '/:formId([a-fA-F0-9]{24})/adminform/images',
  withUserAuthentication,
  fileUploadValidator,
  AdminFormController.handleCreatePresignedPostUrlForImages,
)

/**
 * Upload logos
 * @route POST /:formId/adminform/logos
 * @security session
 *
 * @returns 200 with presigned POST URL object
 * @returns 400 when error occurs whilst creating presigned POST URL object
 * @returns 400 when Joi validation fails
 * @returns 401 when user does not exist in session
 * @returns 403 when user does not have write permissions for form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 */
AdminFormsRouter.post(
  '/:formId([a-fA-F0-9]{24})/adminform/logos',
  withUserAuthentication,
  fileUploadValidator,
  AdminFormController.handleCreatePresignedPostUrlForLogos,
)

/**
 * Submit an encrypt mode form in preview mode
 * @route POST /v2/submissions/encrypt/preview/:formId([a-fA-F0-9]{24})
 * @security session
 *
 * @returns 200 if submission was valid
 * @returns 400 when error occurs while processing submission or submission is invalid
 * @returns 403 when user does not have read permissions for form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
AdminFormsRouter.post(
  '/v2/submissions/encrypt/preview/:formId([a-fA-F0-9]{24})',
  withUserAuthentication,
  EncryptSubmissionMiddleware.validateEncryptSubmissionParams,
  AdminFormController.handleEncryptPreviewSubmission,
)
