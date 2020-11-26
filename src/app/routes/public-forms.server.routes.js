'use strict'

/**
 * Module dependencies.
 */
const forms = require('../../app/controllers/forms.server.controller')
const publicForms = require('../../app/controllers/public-forms.server.controller')
const submissions = require('../../app/controllers/submissions.server.controller')
const encryptSubmissions = require('../../app/controllers/encrypt-submissions.server.controller')
const emailSubmissions = require('../../app/controllers/email-submissions.server.controller')
const myInfoController = require('../../app/controllers/myinfo.server.controller')
const { celebrate, Joi, Segments } = require('celebrate')
const webhookVerifiedContentFactory = require('../factories/webhook-verified-content.factory')
const { CaptchaFactory } = require('../factories/captcha.factory')
const { limitRate } = require('../utils/limit-rate')
const { rateLimitConfig } = require('../../config/config')
const PublicFormController = require('../modules/form/public-form/public-form.controller')
const SpcpController = require('../modules/spcp/spcp.controller')
const { BasicField } = require('../../types')

module.exports = function (app) {
  /**
   * Redirect a form to the main index, with the specified path
   * suffixed with a hashbang (`/#!`)
   * parameter Id is used instead of formId as formById middleware is not needed
   * @route GET /{Id}
   * @route GET /{Id}/preview
   * @route GET /{Id}/embed
   * @route GET /{Id}/template
   * @route GET /{Id}/use-template
   * @group forms - endpoints to serve forms
   * @param {string} Id.path.required - the form id
   * @produces text/html
   * @returns {string} 302 - redirects the user to the specified form,
   * through the main index, with the form id specified as a hashbang path
   */
  app
    .route('/:Id([a-fA-F0-9]{24})/:state(preview|template|use-template)?')
    .get(PublicFormController.handleRedirect)

  // TODO: Remove this embed endpoint
  app
    .route('/:Id([a-fA-F0-9]{24})/embed')
    .get(PublicFormController.handleRedirect)

  /**
   * Redirect a form to the main index, with the specified path
   * suffixed with a hashbang (`/#!`). /forms/:agency is added for backward compatibility.
   * parameter Id is used instead of formId as formById middleware is not needed
   * TODO: Remove once all form links being shared do not have /forms/:agency
   * @route GET /forms/:agency/{Id}
   * @route GET /forms/:agency/{Id}/preview
   * @route GET /forms/:agency/{Id}/embed
   * @route GET /forms/:agency/{Id}/template
   * @route GET /{Id}/use-template
   * @group forms - endpoints to serve forms
   * @param {string} Id.path.required - the form id
   * @produces text/html
   * @returns {string} 302 - redirects the user to the specified form,
   * through the main index, with the form id specified as a hashbang path
   */
  app
    .route(
      '/forms/:agency/:Id([a-fA-F0-9]{24})/:state(preview|template|use-template)?',
    )
    .get(PublicFormController.handleRedirect)

  // TODO: Remove this embed endpoint
  app
    .route('/forms/:agency/:Id([a-fA-F0-9]{24})/embed')
    .get(PublicFormController.handleRedirect)

  /**
   * @typedef Feedback
   * @property {number} rating.required - the user's rating of the form
   * @property {string} comment - any comments the user might have
   */

  /**
   * Send feedback for a public form
   * @route POST /:formId/feedback
   * @group forms - endpoints to serve forms
   * @param {string} formId.path.required - the form id
   * @param {Feedback.model} feedback.body.required - the user's feedback
   * @consumes application/json
   * @produces application/json
   * @returns 200 if feedback was successfully saved
   * @returns 400 if form feedback was malformed and hence cannot be saved
   * @returns 404 if form with formId does not exist or is private
   * @returns 410 if form has been archived
   * @returns 500 if database error occurs
   */
  app.route('/:formId([a-fA-F0-9]{24})/feedback').post(
    celebrate({
      [Segments.BODY]: Joi.object()
        .keys({
          rating: Joi.number().min(1).max(5).cast('string').required(),
          comment: Joi.string().allow('').required(),
        })
        // Allow other keys for backwards compability as frontend might put
        // extra keys in the body.
        .unknown(true),
    }),
    PublicFormController.handleSubmitFeedback,
  )

  /**
   * @typedef PublicForm
   * @property {object} form.required - the form
   * @property {object} spcpSession - contains identity information from SingPass/CorpPass
   * @property {boolean} myInfoError - indicates if there was any errors while accessing MyInfo
   */

  /**
   * Returns the specified form to the user, along with any
   * identity information obtained from SingPass/CorpPass,
   * and MyInfo details, if any.
   * @route GET /{formId}/publicform
   * @group forms - endpoints to serve forms
   * @param {string} formId.path.required - the form id
   * @consumes application/json
   * @produces application/json
   * @returns {string} 404 - form is not made public
   * @returns {PublicForm.model} 200 - the form, and other information
   */
  app
    .route('/:formId([a-fA-F0-9]{24})/publicform')
    .get(
      forms.formById,
      publicForms.isFormPublic,
      SpcpController.addSpcpSessionInfo,
      myInfoController.addMyInfo,
      forms.read(forms.REQUEST_TYPE.PUBLIC),
    )

  /**
   * @typedef SubmissionResponse
   * @property {string} message.required - a human-readable message
   * @property {string} submissionId - the id of the submission made
   * @property {boolean} spcpSubmissionFailure - indicates if there was a failure relating to SingPass/CorpPass
   */

  /**
   * Submit a form response, processing it as an email to be sent to
   * the public servant who created the form. Optionally send a PDF
   * containing the submission back to the user, if an email address
   * was given. SMS autoreplies for mobile number fields are also sent if feature
   * is enabled.
   * Note that v2 endpoint no longer accepts body.captchaResponse
   * @route POST /v2/submissions/email/{formId}
   * @group forms - endpoints to serve forms
   * @param {string} formId.path.required - the form id
   * @param {string} response.body.required - contains the entire form submission
   * @param {string} captchaResponse.query - contains the reCAPTCHA response artifact, if any
   * @consumes multipart/form-data
   * @produces application/json
   * @returns {SubmissionResponse.model} 200 - submission made
   * @returns {SubmissionResponse.model} 400 - submission has bad data and could not be processed
   */
  app.route('/v2/submissions/email/:formId([a-fA-F0-9]{24})').post(
    limitRate({ max: rateLimitConfig.submissions }),
    CaptchaFactory.validateCaptcha,
    forms.formById,
    publicForms.isFormPublic,
    CaptchaFactory.captchaCheck,
    SpcpController.isSpcpAuthenticated,
    emailSubmissions.receiveEmailSubmissionUsingBusBoy,
    celebrate({
      body: Joi.object({
        responses: Joi.array()
          .items(
            Joi.object()
              .keys({
                _id: Joi.string().required(),
                question: Joi.string().required(),
                fieldType: Joi.string()
                  .required()
                  .valid(Object.values(BasicField)),
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
    emailSubmissions.validateEmailSubmission,
    myInfoController.verifyMyInfoVals,
    submissions.injectAutoReplyInfo,
    SpcpController.appendVerifiedSPCPResponses,
    emailSubmissions.prepareEmailSubmission,
    emailSubmissions.saveMetadataToDb,
    emailSubmissions.sendAdminEmail,
    submissions.sendAutoReply,
  )

  /**
   * On preview, submit a form response, and stores the encrypted contents. Optionally, an autoreply
   * confirming submission is sent back to the user, if an email address
   * was given. SMS autoreplies for mobile number fields are also sent if feature
   * is enabled.
   * Note that v2 endpoint no longer accepts body.captchaResponse
   * Note that v2 endpoint accepts requests in content-type json, instead of content-type multi-part
   * Note that v2 endpoint now requires body.version
   * @route POST /v2/submissions/encrypt/{formId}
   * @group forms - endpoints to serve forms
   * @param {string} formId.path.required - the form id
   * @param {string} response.body.required - contains the entire form submission
   * @param {string} captchaResponse.query - contains the reCAPTCHA response artifact, if any
   * @param {string} encryptedContent.body.required - contains the entire encrypted form submission
   * @consumes multipart/form-data
   * @produces application/json
   * @returns {SubmissionResponse.model} 200 - submission made
   * @returns {SubmissionResponse.model} 400 - submission has bad data and could not be processed
   */
  app.route('/v2/submissions/encrypt/:formId([a-fA-F0-9]{24})').post(
    limitRate({ max: rateLimitConfig.submissions }),
    CaptchaFactory.validateCaptcha,
    celebrate({
      body: Joi.object({
        responses: Joi.array()
          .items(
            Joi.object().keys({
              _id: Joi.string().required(),
              answer: Joi.string().allow('').required(),
              fieldType: Joi.string()
                .required()
                .valid(Object.values(BasicField)),
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
    forms.formById,
    publicForms.isFormPublic,
    CaptchaFactory.captchaCheck,
    encryptSubmissions.validateEncryptSubmission,
    SpcpController.isSpcpAuthenticated,
    myInfoController.verifyMyInfoVals,
    submissions.injectAutoReplyInfo,
    webhookVerifiedContentFactory.encryptedVerifiedFields,
    encryptSubmissions.prepareEncryptSubmission,
    encryptSubmissions.saveResponseToDb,
    webhookVerifiedContentFactory.post,
    submissions.sendAutoReply,
  )
}
