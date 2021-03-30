'use strict'

/**
 * Module dependencies.
 */
const { celebrate, Joi, Segments } = require('celebrate')

let forms = require('../../app/controllers/forms.server.controller')
let adminForms = require('../../app/controllers/admin-forms.server.controller')
let auth = require('../../app/controllers/authentication.server.controller')
const EmailSubmissionsMiddleware = require('../../app/modules/submission/email-submission/email-submission.middleware')
const SubmissionsMiddleware = require('../../app/modules/submission/submission.middleware')
const AdminFormController = require('../modules/form/admin-form/admin-form.controller')
const { withUserAuthentication } = require('../modules/auth/auth.middlewares')
const EncryptSubmissionController = require('../modules/submission/encrypt-submission/encrypt-submission.controller')
const {
  PermissionLevel,
} = require('../modules/form/admin-form/admin-form.types')
const EncryptSubmissionMiddleware = require('../modules/submission/encrypt-submission/encrypt-submission.middleware')
const SpcpController = require('../modules/spcp/spcp.controller')
const { BasicField, ResponseMode } = require('../../types')
const VerifiedContentMiddleware = require('../modules/verified-content/verified-content.middlewares')

const YYYY_MM_DD_REGEX = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/

const emailValOpts = {
  minDomainSegments: 2, // Number of segments required for the domain
  tlds: true, // TLD (top level domain) validation
  multiple: false, // Disallow multiple emails
}

/**
 * Authenticates logged in user, before retrieving non-archived form
 * and verifying read/write permissions.
 * @param {enum} requiredPermission
 */
let authActiveForm = (requiredPermission) => [
  withUserAuthentication,
  forms.formById,
  adminForms.isFormActive,
  auth.verifyPermission(requiredPermission),
]

/**
 * Ensures that user has read permissions,form is encrypt-mode and
 * form admin is encrypt beta-enabled.
 */
const authEncryptedResponseAccess = [
  authActiveForm(PermissionLevel.Read),
  adminForms.isFormEncryptMode,
]

module.exports = function (app) {
  /**
   * @typedef ErrorMessage
   * @property {string} message.required - the error message
   */

  /**
   * @typedef FormCreateRequest
   * @property {object} form.required - the form to be created
   */

  app
    .route('/adminform')
    /**
     * List the forms managed by the user
     * @route GET /adminform
     * @group admin - endpoints to manage forms
     * @produces application/json
     * @returns {Array.<object>} 200 - the forms managed by the user
     * @returns {ErrorMessage.model} 400 - error encountered while finding the forms
     * @security OTP
     */
    .get(withUserAuthentication, AdminFormController.handleListDashboardForms)
    /**
     * Create a new form in FormSG
     * @route POST /adminform
     * @group admin - endpoints to manage forms
     * @param {FormCreateRequest.model} form.body.required - the form
     * @produces application/json
     * @returns {object} 200 - the created form
     * @returns {ErrorMessage.model} 400 - invalid input
     * @returns {ErrorMessage.model} 405 - error encountered while creating the form
     * @security OTP
     */
    .post(
      withUserAuthentication,
      celebrate({
        [Segments.BODY]: {
          form: Joi.object()
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
                .try(Joi.array().items(Joi.string()), Joi.string())
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
      }),
      AdminFormController.handleCreateForm,
    )

  /**
   * @typedef AdminForm
   * @property {object} form.required - the form
   */

  /**
   * @typedef DuplicateRequest
   * @property {number} name.required - the number suffix to apply to the duplicated form
   */

  // Collection of routes that operate on the entire form object
  app
    .route('/:formId([a-fA-F0-9]{24})/adminform')
    /**
     * Return the specified form to the user
     * @route GET /{formId}/adminform
     * @group admin - endpoints to manage forms
     * @param {string} formId.path.required - the form id
     * @produces application/json
     * @returns {ErrorMessage.model} 400 - invalid formId
     * @returns {ErrorMessage.model} 401 - user not logged in
     * @returns {ErrorMessage.model} 403 - user does not have write permission
     * @returns {ErrorMessage.model} 404 - form has been archived or form not found
     * @returns {AdminForm.model} 200 - the form
     * @security OTP
     */
    .get(withUserAuthentication, AdminFormController.handleGetAdminForm)
    /**
     * Update the specified form
     * @route PUT /{formId}/adminform
     * @group admin - endpoints to manage forms
     * @param {string} formId.path.required - the form id
     * @produces application/json
     * @returns {ErrorMessage.model} 400 - invalid formId
     * @returns {ErrorMessage.model} 401 - user not logged in
     * @returns {ErrorMessage.model} 403 - user does not have write permission
     * @returns {ErrorMessage.model} 404 - form has been archived or form not found
     * @returns {ErrorMessage.model} 405 - error encountered while saving the form
     * @returns {object} 200 - the updated form
     * @security OTP
     */
    .put(withUserAuthentication, AdminFormController.handleUpdateForm)
    /**
     * Archive the specified form
     * @route DELETE /{formId}/adminform
     * @group admin - endpoints to manage forms
     * @param {string} formId.path.required - the form id
     * @produces application/json
     * @returns {ErrorMessage.model} 400 - invalid formId
     * @returns {ErrorMessage.model} 401 - user not logged in
     * @returns {ErrorMessage.model} 403 - user does not have delete permission
     * @returns {ErrorMessage.model} 404 - form has been archived or form not found
     * @returns {ErrorMessage.model} 405 - error encountered while archiving the form
     * @returns {object} 200 - the archived form
     * @security OTP
     */
    .delete(withUserAuthentication, AdminFormController.handleArchiveForm)
    /**
     * Duplicate the specified form
     * @route POST /{formId}/adminform
     * @group admin - endpoints to manage forms
     * @param {string} formId.path.required - the form id
     * @param {DuplicateRequest.model} name.body.required - the suffix to apply to the duplicated form
     * @produces application/json
     * @returns {ErrorMessage.model} 400 - error encountered while retrieving the form
     * @returns {ErrorMessage.model} 401 - user not logged in
     * @returns {ErrorMessage.model} 403 - user does not have write permission
     * @returns {ErrorMessage.model} 404 - form has been archived or form not found
     * @returns {ErrorMessage.model} 405 - error encountered while duplicating the form
     * @returns {object} 200 - the duplicated form
     * @security OTP
     */
    .post(
      withUserAuthentication,
      celebrate({
        [Segments.BODY]: {
          // Require valid responsesMode field.
          responseMode: Joi.string()
            .valid(...Object.values(ResponseMode))
            .required(),
          // Require title field.
          title: Joi.string().min(4).max(200).required(),
          // Require emails string (for backwards compatibility) or string array
          // if form to be duplicated in Email mode.
          emails: Joi.alternatives()
            .try(Joi.array().items(Joi.string()), Joi.string())
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
        },
      }),
      AdminFormController.handleDuplicateAdminForm,
    )

  /**
   * Return the template form to the user.
   * Only allows for public forms, for any logged in user.
   * @route GET /{formId}/adminform/template
   * @group admin - endpoints to manage forms
   * @param {string} formId.path.required - the form id
   * @produces application/json
   * @returns {ErrorMessage.model} 400 - invalid formId
   * @returns {ErrorMessage.model} 401 - user not logged in
   * @returns {ErrorMessage.model} 404 - form has been archived or form not found
   * @returns {AdminForm.model} 200 - the form
   * @security OTP
   */
  app
    .route('/:formId([a-fA-F0-9]{24})/adminform/template')
    .get(withUserAuthentication, AdminFormController.handleGetTemplateForm)

  /**
   * Return the preview form to the user.
   * Allows for both public and private forms, only for users with at least read permission.
   * This endpoint is also used to retrieve the form object for duplication.
   * @route GET /{formId}/adminform/preview
   * @group admin - endpoints to manage forms
   * @param {string} formId.path.required - the form id
   * @produces application/json
   * @returns {ErrorMessage.model} 400 - invalid formId
   * @returns {ErrorMessage.model} 401 - user not logged in
   * @returns {ErrorMessage.model} 403 - user does not have at least read permission
   * @returns {ErrorMessage.model} 404 - form has been archived or form not found
   * @returns {AdminForm.model} 200 - the form
   * @security OTP
   */
  app
    .route('/:formId([a-fA-F0-9]{24})/adminform/preview')
    .get(withUserAuthentication, AdminFormController.handlePreviewAdminForm)

  /**
   * Duplicate a specified form and return that form to the user.
   * @route GET /{formId}/adminform/copy
   * @group admin - endpoints to manage forms
   * @param {string} formId.path.required - the form id
   * @produces application/json
   * @returns {ErrorMessage.model} 400 - invalid formId
   * @returns {ErrorMessage.model} 401 - user not logged in
   * @returns {ErrorMessage.model} 404 - form has been archived or form not found
   * @returns {AdminForm.model} 200 - the form
   * @security OTP
   */
  app.route('/:formId([a-fA-F0-9]{24})/adminform/copy').post(
    withUserAuthentication,
    celebrate({
      [Segments.BODY]: {
        // Require valid responsesMode field.
        responseMode: Joi.string()
          .valid(...Object.values(ResponseMode))
          .required(),
        // Require title field.
        title: Joi.string().min(4).max(200).required(),
        // Require emails string (for backwards compatibility) or string array
        // if form to be duplicated in Email mode.
        emails: Joi.alternatives()
          .try(Joi.array().items(Joi.string()), Joi.string())
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
      },
    }),
    AdminFormController.handleCopyTemplateForm,
  )

  /**
   * @typedef FeedbackResponse
   * @property {number} average.required - the average rating
   * @property {number} count.required - the total number of feedback received
   * @property {Array.<Feedback>} feedback.required - all the feedback in an array
   */

  /**
   * @typedef Feedback
   * @property {number} timestamp.required - the time in epoch milliseconds that the feedback was received
   * @property {number} rating.required - the user's rating of the form
   * @property {string} comment.required - any comments the user might have
   * @property {string} date.required - the date the feedback was received, in the moment format `D MMM YYYY`
   * @property {string} dateShort.required - the date the feedback was received, in the moment format `D MMM`
   */

  /**
   * Retrieve feedback for a public form
   * @route GET /{formId}/adminform/feedback
   * @group admin - endpoints to manage forms
   * @param {string} formId.path.required - the form id
   * @produces application/json
   * @returns {ErrorMessage.model} 400 - Errors while querying for feedback
   * @returns {FeedbackResponse.model} 200 - form feedback was saved
   * @security OTP
   */
  app
    .route('/:formId([a-fA-F0-9]{24})/adminform/feedback')
    .get(withUserAuthentication, AdminFormController.handleGetFormFeedbacks)

  /**
   * Count the number of feedback for a form
   * @route GET /{formId}/adminform/feedback/count
   * @group admin - endpoints to manage forms
   * @param {string} formId.path.required - the form id
   * @produces application/json
   * @returns {Error.model} 400 - Errors while querying for feedback
   * @returns {number} 200 - the feedback count
   * @security OTP
   */
  app
    .route('/:formId([a-fA-F0-9]{24})/adminform/feedback/count')
    .get(withUserAuthentication, AdminFormController.handleCountFormFeedback)

  /**
   * Stream download all feedback for a form
   * @route GET /{formId}/adminform/feedback/download
   * @group forms - endpoints to manage forms
   * @param {string} formId.path.required - the form id
   * @param {Feedback.model} feedback.body.required - the user's feedback
   * @produces application/json
   * @returns {ErrorMessage.model} 500 - Errors while querying for response
   * @returns {Object} 200 - Response document
   */
  app
    .route('/:formId([a-fA-F0-9]{24})/adminform/feedback/download')
    .get(withUserAuthentication, AdminFormController.handleStreamFormFeedback)

  /**
   * Transfer form ownership to another user
   * @route POST /{formId}/adminform/transfer-owner
   * @group forms - endpoints to manage forms
   * @param {string} formId.path.required - the form id
   * @param {string} request.body.email.required - the new owner's email address
   * @produces application/json
   * @returns {ErrorMessage.model} 500 - Errors while querying for response
   * @returns {Object} 200 - Response document
   */
  app.route('/:formId([a-fA-F0-9]{24})/adminform/transfer-owner').post(
    withUserAuthentication,
    celebrate({
      [Segments.BODY]: {
        email: Joi.string()
          .required()
          .email(emailValOpts)
          .message('Please enter a valid email'),
      },
    }),
    AdminFormController.handleTransferFormOwnership,
  )

  /**
   * On preview, submit a form response, processing it as an email to be sent to
   * the public servant who created the form. Optionally, email a PDF
   * containing the submission back to the user, if an email address
   * was given. SMS autoreplies for mobile number fields are also sent if feature
   * is enabled.
   * Note that preview submissions are not saved to db
   * Note that spcp session is not verified, neither is myInfo data verified
   * @route POST /v2/submissions/email/preview/{formId}
   * @group forms - endpoints to serve forms
   * @param {string} formId.path.required - the form id
   * @param {Array} response.body.required - contains the entire form submission
   * @consumes multipart/form-data
   * @produces application/json
   * @returns {SubmissionResponse.model} 200 - submission made
   * @returns {SubmissionResponse.model} 400 - submission has bad data and could not be processed
   * @security OTP
   */
  app.route('/v2/submissions/email/preview/:formId([a-fA-F0-9]{24})').post(
    authActiveForm(PermissionLevel.Read),
    EmailSubmissionsMiddleware.receiveEmailSubmission,
    celebrate({
      [Segments.BODY]: Joi.object({
        responses: Joi.array()
          .items(
            Joi.object()
              .keys({
                _id: Joi.string().required(),
                question: Joi.string().required(),
                fieldType: Joi.string()
                  .required()
                  .valid(...Object.values(BasicField)),
                answer: Joi.string().allow(''),
                answerArray: Joi.array(),
                filename: Joi.string(),
                content: Joi.binary(),
                isHeader: Joi.boolean(),
                myInfo: Joi.object(),
                signature: Joi.string().allow(''),
              })
              .xor('answer', 'answerArray') // only answer or answerArray can be present at once
              .with('filename', 'content'), // if filename is present, content must be present
          )
          .required(),
        isPreview: Joi.boolean().required(),
      }),
    }),
    EmailSubmissionsMiddleware.validateEmailSubmission,
    AdminFormController.passThroughSpcp,
    SpcpController.appendVerifiedSPCPResponses,
    EmailSubmissionsMiddleware.prepareEmailSubmission,
    adminForms.passThroughSaveMetadataToDb,
    EmailSubmissionsMiddleware.sendAdminEmail,
    SubmissionsMiddleware.sendEmailConfirmations,
  )

  /**
   * On preview, submit a form response, and stores the encrypted contents. Optionally, an autoreply
   * confirming submission is sent back to the user, if an email address
   * was given. SMS autoreplies for mobile number fields are also sent if feature
   * is enabled.
   * Note that preview submissions are not saved to db
   * Note that spcp session is not verified, neither is myInfo data verified
   * Note that webhooks are not supported as they require an actual submission document to be created
   * Note that v2 endpoint accepts requests in content-type json, instead of content-type multi-part
   * @route POST /v2/submissions/encrypt/preview/{formId}
   * @group forms - endpoints to serve forms
   * @param {string} formId.path.required - the form id
   * @param {Array} response.body.required - contains only the auto-reply fields
   * @param {string} encryptedContent.body.required - contains the entire encrypted form submission
   * @consumes multipart/form-data
   * @produces application/json
   * @returns {SubmissionResponse.model} 200 - submission made
   * @returns {SubmissionResponse.model} 400 - submission has bad data and could not be processed
   * @security OTP
   */
  app.route('/v2/submissions/encrypt/preview/:formId([a-fA-F0-9]{24})').post(
    celebrate({
      [Segments.BODY]: Joi.object({
        responses: Joi.array()
          .items(
            Joi.object().keys({
              _id: Joi.string().required(),
              answer: Joi.string().allow('').required(),
              fieldType: Joi.string()
                .required()
                .valid(...Object.values(BasicField)),
              signature: Joi.string().allow(''),
            }),
          )
          .required(),
        encryptedContent: Joi.string()
          .custom((value, helpers) => {
            const parts = String(value).split(/;|:/)
            if (
              parts.length !== 3 ||
              parts[0].length !== 44 || // public key
              parts[1].length !== 32 || // nonce
              !parts.every((part) => Joi.string().base64().validate(part))
            ) {
              return helpers.error('Invalid encryptedContent.')
            }
            return value
          }, 'encryptedContent')
          .required(),
        attachments: Joi.object()
          .pattern(
            /^[a-fA-F0-9]{24}$/,
            Joi.object().keys({
              encryptedFile: Joi.object().keys({
                binary: Joi.string().required(),
                nonce: Joi.string().required(),
                submissionPublicKey: Joi.string().required(),
              }),
            }),
          )
          .optional(),
        isPreview: Joi.boolean().required(),
        version: Joi.number().required(),
      }),
    }),
    authActiveForm(PermissionLevel.Read),
    EncryptSubmissionMiddleware.validateAndProcessEncryptSubmission,
    AdminFormController.passThroughSpcp,
    VerifiedContentMiddleware.encryptVerifiedSpcpFields,
    EncryptSubmissionMiddleware.prepareEncryptSubmission,
    adminForms.passThroughSaveMetadataToDb,
    SubmissionsMiddleware.sendEmailConfirmations,
  )

  /**
   * Retrieve actual response for a form with encrypted storage
   * @route GET /{formId}/adminform/submissions
   * @group admin - endpoints to manage forms
   * @param {string} formId.path.required - the form id
   * @param {number} submissionId.query.required - the submission id
   * @produces application/json
   * @returns {ErrorMessage.model} 400 - Errors while querying for response
   * @returns {Object} 200 - Response document
   * @security OTP
   */
  app.route('/:formId([a-fA-F0-9]{24})/adminform/submissions').get(
    authEncryptedResponseAccess,
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
   * @route GET /{formId}/adminform/submissions/count
   * @group admin - endpoints to manage forms
   * @param {string} formId.path.required - the form id
   * @produces application/json
   * @returns {Error.model} 400 - Errors while querying for feedback
   * @returns {number} 200 - the submission count
   * @security OTP
   */
  app.route('/:formId([a-fA-F0-9]{24})/adminform/submissions/count').get(
    celebrate({
      [Segments.QUERY]: Joi.object()
        .keys({
          // Ensure YYYY-MM-DD format.
          startDate: Joi.string().regex(YYYY_MM_DD_REGEX),
          // Ensure YYYY-MM-DD format.
          endDate: Joi.string().regex(YYYY_MM_DD_REGEX),
        })
        .and('startDate', 'endDate'),
    }),
    withUserAuthentication,
    AdminFormController.handleCountFormSubmissions,
  )

  /**
   * @typedef metadataResponse
   * @property {Array.<metadata>} metadata.required - all the metadata in an array
   * @property {number} numResults.required - the total number of responses
   */

  /**
   * Retrieve metadata of responses for a form with encrypted storage
   * @route GET /{formId}/adminform/submissions/metadata
   * @group admin - endpoints to manage forms
   * @param {string} formId.path.required - the form id
   * @produces application/json
   * @returns {ErrorMessage.model} 400 - Errors while querying for response
   * @returns {metadataResponse.model} 200 - Metadata of responses
   * @security OTP
   */
  app.route('/:formId([a-fA-F0-9]{24})/adminform/submissions/metadata').get(
    authEncryptedResponseAccess,
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
   * @route GET /{formId}/adminform/submissions/download
   * @group admin - endpoints to manage forms
   * @param {string} formId.path.required - the form id
   * @produces application/json
   * @returns {ErrorMessage.model} 500 - Errors while querying for response
   * @returns {Object} 200 - Response document
   * @security OTP
   */
  app.route('/:formId([a-fA-F0-9]{24})/adminform/submissions/download').get(
    withUserAuthentication,
    celebrate({
      [Segments.QUERY]: Joi.object()
        .keys({
          // Ensure YYYY-MM-DD format.
          startDate: Joi.string().regex(YYYY_MM_DD_REGEX),
          // Ensure YYYY-MM-DD format.
          endDate: Joi.string().regex(YYYY_MM_DD_REGEX),
          downloadAttachments: Joi.boolean().default(false),
        })
        .and('startDate', 'endDate'),
    }),
    EncryptSubmissionController.handleStreamEncryptedResponses,
  )

  /**
   * Upload images
   * @route POST /{formId}/adminform/images
   * @group admin - endpoints to manage forms
   * @produces application/json
   * @returns {ErrorMessage.model} 400 - Error while creating presigned post
   * @returns {Object} 200 - Response document
   * @security OTP
   */
  app.route('/:formId([a-fA-F0-9]{24})/adminform/images').post(
    withUserAuthentication,
    celebrate({
      [Segments.BODY]: {
        fileId: Joi.string()
          .required()
          .error(() => 'Please enter a valid file id'),
        fileMd5Hash: Joi.string()
          .base64()
          .required()
          .error(() => 'Error - your file could not be verified'),
        fileType: Joi.string()
          .required()
          .error(() => 'Error - your file could not be verified'),
      },
    }),
    AdminFormController.handleCreatePresignedPostUrlForImages,
  )

  /**
   * Upload logos
   * @route POST /{formId}/adminform/logos
   * @group admin - endpoints to manage forms
   * @produces application/json
   * @returns {ErrorMessage.model} 400 - Error while creating presigned post
   * @returns {Object} 200 - Response document
   * @security OTP
   */
  app.route('/:formId([a-fA-F0-9]{24})/adminform/logos').post(
    withUserAuthentication,
    celebrate({
      [Segments.BODY]: {
        fileId: Joi.string()
          .required()
          .error(() => 'Please enter a valid file id'),
        fileMd5Hash: Joi.string()
          .base64()
          .required()
          .error(() => 'Error - your file could not be verified'),
        fileType: Joi.string()
          .required()
          .error(() => 'Error - your file could not be verified'),
      },
    }),
    AdminFormController.handleCreatePresignedPostUrlForLogos,
  )
}
