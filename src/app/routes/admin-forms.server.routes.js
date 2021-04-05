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
const {
  PermissionLevel,
} = require('../modules/form/admin-form/admin-form.types')
const EncryptSubmissionMiddleware = require('../modules/submission/encrypt-submission/encrypt-submission.middleware')
const SpcpController = require('../modules/spcp/spcp.controller')
const { BasicField } = require('../../types')

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

module.exports = function (app) {
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
  app
    .route('/v2/submissions/encrypt/preview/:formId([a-fA-F0-9]{24})')
    .post(
      withUserAuthentication,
      EncryptSubmissionMiddleware.validateEncryptSubmissionParams,
      AdminFormController.handleEncryptPreviewSubmission,
    )
}
