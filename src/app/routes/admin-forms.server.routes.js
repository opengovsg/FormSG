'use strict'

/**
 * Module dependencies.
 */
const { celebrate, Joi, Segments } = require('celebrate')

let forms = require('../../app/controllers/forms.server.controller')
let adminForms = require('../../app/controllers/admin-forms.server.controller')
let publicForms = require('../../app/controllers/public-forms.server.controller')
let auth = require('../../app/controllers/authentication.server.controller')
let submissions = require('../../app/controllers/submissions.server.controller')
const emailSubmissions = require('../../app/controllers/email-submissions.server.controller')
let encryptSubmissions = require('../../app/controllers/encrypt-submissions.server.controller')
const webhookVerifiedContentFactory = require('../factories/webhook-verified-content.factory')
const AdminFormController = require('../modules/form/admin-form/admin-form.controller')
const { withUserAuthentication } = require('../modules/auth/auth.middlewares')
const EncryptSubmissionController = require('../modules/submission/encrypt-submission/encrypt-submission.controller')
const {
  PermissionLevel,
} = require('../modules/form/admin-form/admin-form.types')
const SpcpController = require('../modules/spcp/spcp.controller')
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
 * Authenticates logged in user, before retrieving non-archived form.
 */
let authAdminActiveAnyForm = [
  withUserAuthentication,
  forms.formById,
  adminForms.isFormActive,
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

  /**
   * List the forms managed by the user
   * @route GET /adminform
   * @group admin - endpoints to manage forms
   * @produces application/json
   * @returns {Array.<object>} 200 - the forms managed by the user
   * @returns {ErrorMessage.model} 400 - error encountered while finding the forms
   * @security OTP
   */
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
  app
    .route('/adminform')
    .get(withUserAuthentication, AdminFormController.handleListDashboardForms)
    .post(withUserAuthentication, adminForms.create)

  /**
   * @typedef AdminForm
   * @property {object} form.required - the form
   */

  /**
   * @typedef DuplicateRequest
   * @property {number} name.required - the number suffix to apply to the duplicated form
   */

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
  app
    .route('/:formId([a-fA-F0-9]{24})/adminform')
    .get(
      authActiveForm(PermissionLevel.Read),
      forms.read(forms.REQUEST_TYPE.ADMIN),
    )
    .put(authActiveForm(PermissionLevel.Write), adminForms.update)
    .delete(authActiveForm(PermissionLevel.Delete), adminForms.delete)
    .post(authActiveForm(PermissionLevel.Read), adminForms.duplicate)

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
    .get(
      authAdminActiveAnyForm,
      publicForms.isFormPublic,
      forms.read(forms.REQUEST_TYPE.ADMIN),
    )

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
    .get(
      authActiveForm(PermissionLevel.Read),
      forms.read(forms.REQUEST_TYPE.ADMIN),
    )

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
  app
    .route('/:formId([a-fA-F0-9]{24})/adminform/copy')
    .post(authAdminActiveAnyForm, adminForms.duplicate)

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
  /**
   * On preview, mock sending of feedback
   * @route POST /{formId}/adminform/feedback
   * @group forms - endpoints to serve forms
   * @param {string} formId.path.required - the form id
   * @param {Feedback.model} feedback.body.required - the user's feedback
   * @consumes application/json
   * @produces application/json
   * @returns {string} 400 - form feedback was malformed
   * @returns {string} 200 - form feedback was received
   */

  app
    .route('/:formId([a-fA-F0-9]{24})/adminform/feedback')
    .get(authActiveForm(PermissionLevel.Read), adminForms.getFeedback)
    .post(authActiveForm(PermissionLevel.Read), adminForms.passThroughFeedback)

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
    .get(authActiveForm(PermissionLevel.Read), adminForms.streamFeedback)

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
    authActiveForm(PermissionLevel.Delete),
    celebrate({
      body: Joi.object().keys({
        email: Joi.string()
          .required()
          .email(emailValOpts)
          .error(() => 'Please enter a valid email'),
      }),
    }),
    adminForms.transferOwner,
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
  app
    .route('/v2/submissions/email/preview/:formId([a-fA-F0-9]{24})')
    .post(
      authActiveForm(PermissionLevel.Read),
      emailSubmissions.receiveEmailSubmissionUsingBusBoy,
      emailSubmissions.validateEmailSubmission,
      AdminFormController.passThroughSpcp,
      submissions.injectAutoReplyInfo,
      SpcpController.appendVerifiedSPCPResponses,
      emailSubmissions.prepareEmailSubmission,
      adminForms.passThroughSaveMetadataToDb,
      emailSubmissions.sendAdminEmail,
      submissions.sendAutoReply,
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
  app
    .route('/v2/submissions/encrypt/preview/:formId([a-fA-F0-9]{24})')
    .post(
      authActiveForm(PermissionLevel.Read),
      encryptSubmissions.validateEncryptSubmission,
      AdminFormController.passThroughSpcp,
      submissions.injectAutoReplyInfo,
      webhookVerifiedContentFactory.encryptedVerifiedFields,
      encryptSubmissions.prepareEncryptSubmission,
      adminForms.passThroughSaveMetadataToDb,
      submissions.sendAutoReply,
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
  app
    .route('/:formId([a-fA-F0-9]{24})/adminform/submissions')
    .get(
      authEncryptedResponseAccess,
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
    authEncryptedResponseAccess,
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
    authActiveForm(PermissionLevel.Write),
    AdminFormController.handleCreatePresignedPostForImages,
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
    authActiveForm(PermissionLevel.Write),
    AdminFormController.handleCreatePresignedPostForLogos,
  )
}
